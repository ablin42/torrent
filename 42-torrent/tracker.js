const dgram = require('dgram');
const { Buffer } = require('buffer');
const urlParse = require('url').parse;
const crypto = require('crypto');
const util = require('./utils');
const torrentParser = require('./torrent-parser');

let isConnected = false;

function udpSend(udpSocket, message, rawUrl, callback = () => {console.log('buffer has been sent')}) {
  const parsedUrl = urlParse(rawUrl);
  udpSocket.send(message, 0, message.length, parsedUrl.port, parsedUrl.hostname, (err, bytes) => {
    if (err) console.error(err);
    console.log(`UDP message sent to ${parsedUrl.hostname}:${parsedUrl.port}`);
  });
}

function respType(resp) {
  const action = resp.readUInt32BE(0);
  if (action === 0) return 'connect';
  if (action === 1) return 'announce';
  return 'error';
}

function buildConnReq() {
  // Message size
  const buf = Buffer.alloc(16);

  // connection id
  // split the 64-bit int to two 32-bit integer in big-endian (node.js dosen't support precise 64-bit int)
  buf.writeUInt32BE(0x417, 0);
  buf.writeUInt32BE(0x27101980, 4);

  // action
  buf.writeUInt32BE(0, 8);

  // transaction id
  // generate a random 4-byte then coppy it to the original buffer
  crypto.randomBytes(4).copy(buf, 12);

  return buf;
}

function parseConnResp(resp) {
  return {
    action: resp.readUInt32BE(0),
    transactionId: resp.readUInt32BE(4),
    connectionId: resp.slice(8)
  };
}

function buildAnnounceReq(connId, torrent, port = 6881) {
  const buf = Buffer.allocUnsafe(98);

  // connection id
  connId.copy(buf, 0);
  // action
  buf.writeUInt32BE(1, 8);
  // transaction id
  crypto.randomBytes(4).copy(buf, 16);
  // info hash
  torrentParser.infoHash(torrent).copy(buf, 16);
  // peerId
  util.genId().copy(buf, 56);
  // downloaded
  Buffer.alloc(8).copy(buf, 72);
  // event
  buf.writeUInt32BE(0, 80);
  // ip address
  buf.writeUInt32BE(0, 84);
  //buf.writeUInt32BE(0, 80);
  // key
  crypto.randomBytes(4).copy(buf, 88);
  // num want
  buf.writeInt32BE(-1, 92);
  // port
  buf.writeUInt16BE(port, 96);

  return buf;
}

function parseAnnounceResp(resp) {
  function group(iterable, groupSize) {
    const groups = [];
    for (let i = 0; i < iterable.length; i += groupSize) {
      groups.push(iterable.slice(i, i + groupSize));
    }
    console.log('groups is ', groups);
    return groups;
  }

  return {
    action: resp.readUInt32BE(0),
    transactionId: resp.readUInt32BE(4),
    leechers: resp.readUInt32BE(8),
    seeders: resp.readUInt32BE(12),
    peers: group(resp.slice(20), 6).map(address => ({
      ip: address.slice(0, 4).join('.'),
      port: address.readUInt16BE(4)
    }))
  };
}

function tryToConnect(udpSocket, url, torrent, callback) {

  udpSend(udpSocket, buildConnReq(), url);

  udpSocket.on('error', (err) => {
    console.log(`server error:\n${err.stack}`);
    udpSocket.close();
  });

  udpSocket.on('message', (response) => {
    isConnected = true;
    console.log('Socket ON!!!!');
    if (respType(response) === 'connect') {
      console.log('connect');
      // 2. receive and parse connect response
      const connResp = parseConnResp(response);
      // 3. send announce request
      const announceReq = buildAnnounceReq(connResp.connectionId, torrent);
      udpSend(udpSocket, announceReq, url);
    }
    else if (respType(response) === 'announce') {
      console.log('announce');
      // 4. parse announce response
      const announceResp = parseAnnounceResp(response);
      // 5. pass peers to callback
      callback(announceResp.peers);
    } else {
      console.log("SOMETHING WENT WRONT WITH YOUR TRACKER");
    }
  });
}

const waitFor = ms => new Promise(r => setTimeout(r, ms));

function tryOfficialAnounce(torrent, udpSocket, callback) {
  const url = torrent.announce.toString('utf8');
  tryToConnect(udpSocket, url, torrent, callback);
}

async function tryAnnounceList(torrent, udpSocket, callback) {
  if (isConnected === false) {
    // eslint-disable-next-line no-restricted-syntax
    for (const urlObj of torrent['announce-list']) {
      const url = urlObj.toString('utf8');
      if (isConnected === false) {
        tryToConnect(udpSocket, url, torrent, callback);
      }
      // eslint-disable-next-line no-await-in-loop
      await waitFor(3000);
    }
  }
}

module.exports.getPeers = async (torrent, callback) => {
  const udpSocket = dgram.createSocket('udp4');

  tryOfficialAnounce(torrent, udpSocket, callback);
  await waitFor(3000);
  tryAnnounceList(torrent, udpSocket, callback);

  if (isConnected === false) {
    // show to the users that none of the trackers are working
    console.error('Could not connect to any tracker');
  }
};
