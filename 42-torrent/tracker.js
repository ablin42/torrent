const dgram = require('dgram');
const { Buffer } = require('buffer');
const urlParse = require('url').parse;
const crypto = require('crypto');
const util = require('./utils');
const torrentParser = require('./torrent-parser');

let isConnected = false;

function udpSend(udpSocket, message, rawUrl, callback = () => {console.log('buffer has been sent')}) {
  const parsedUrl = urlParse(rawUrl);
  if ( parsedUrl.port > 0) {
    udpSocket.send(message, 0, message.length, parsedUrl.port, parsedUrl.hostname, (err, bytes) => {
      // if (err) console.error(err);
      // console.log(`UDP message sent to ${parsedUrl.hostname}:${parsedUrl.port}`);
    });
  }
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
    //console.log('groups is ', groups);
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
    if (respType(response) === 'connect') {
      // 2. receive and parse connect response
      const connResp = parseConnResp(response);
      // 3. send announce request
      const announceReq = buildAnnounceReq(connResp.connectionId, torrent);
      udpSend(udpSocket, announceReq, url);
    }
    else if (respType(response) === 'announce') {
      // 4. parse announce response
      const announceResp = parseAnnounceResp(response);
      // 5. pass peers to callback
      callback(announceResp.peers);
    } else {
    //  console.log("SOMETHING WENT WRONG WITH YOUR TRACKER");
    }
  });
}

const waitFor = ms => new Promise(r => setTimeout(r, ms));

function tryOfficialAnounce(torrent, udpSocket, callback) {
  const url = torrent.announce.toString('utf8');
  tryToConnect(udpSocket, url, torrent, callback);
}

trackers = ["udp://107.150.14.110:6969/announce"]
// "udp://109.121.134.121:1337/announce",
// "udp://114.55.113.60:6969/announce",
// "udp://128.199.70.66:5944/announce",
// "udp://151.80.120.114:2710/announce",
// "udp://168.235.67.63:6969/announce",
// "udp://178.33.73.26:2710/announce",
// "udp://182.176.139.129:6969/announce",
// "udp://185.5.97.139:8089/announce",
// "udp://185.86.149.205:1337/announce",
// "udp://188.165.253.109:1337/announce",
// "udp://191.101.229.236:1337/announce",
// "udp://194.106.216.222:80/announce",
// "udp://195.123.209.37:1337/announce",
// "udp://195.123.209.40:80/announce",
// "udp://208.67.16.113:8000/announce",
// "udp://213.163.67.56:1337/announce",
// "udp://37.19.5.155:2710/announce",
// "udp://46.4.109.148:6969/announce",
// "udp://5.79.249.77:6969/announce",
// "udp://5.79.83.193:6969/announce",
// "udp://51.254.244.161:6969/announce",
// "udp://62.138.0.158:6969/announce",
// "udp://62.212.85.66:2710/announce",
// "udp://74.82.52.209:6969/announce",
// "udp://85.17.19.180:80/announce",
// "udp://89.234.156.205:80/announce",
// "udp://9.rarbg.com:2710/announce",
// "udp://9.rarbg.me:2780/announce",
// "udp://9.rarbg.to:2730/announce",
// "udp://91.218.230.81:6969/announce",
// "udp://94.23.183.33:6969/announce",
// "udp://bt.xxx-tracker.com:2710/announce",
// "udp://eddie4.nl:6969/announce",
// "udp://explodie.org:6969/announce",
// "udp://mgtracker.org:2710/announce",
// "udp://open.stealth.si:80/announce",
// "udp://p4p.arenabg.com:1337/announce",
// "udp://shadowshq.eddie4.nl:6969/announce",
// "udp://shadowshq.yi.org:6969/announce",
// "udp://torrent.gresille.org:80/announce",
// "udp://tracker.aletorrenty.pl:2710/announce",
// "udp://tracker.bittor.pw:1337/announce",
// "udp://tracker.coppersurfer.tk:6969/announce",
// "udp://tracker.eddie4.nl:6969/announce",
// "udp://tracker.ex.ua:80/announce",
// "udp://tracker.filetracker.pl:8089/announce",
// "udp://tracker.flashtorrents.org:6969/announce",
// "udp://tracker.grepler.com:6969/announce",
// "udp://tracker.ilibr.org:80/announce",
// "udp://tracker.internetwarriors.net:1337/announce",
// "udp://tracker.kicks-ass.net:80/announce",
// "udp://tracker.kuroy.me:5944/announce",
// "udp://tracker.leechers-paradise.org:6969/announce",
// "udp://tracker.mg64.net:2710/announce",
// "udp://tracker.mg64.net:6969/announce",
// "udp://tracker.opentrackr.org:1337/announce",
// "udp://tracker.piratepublic.com:1337/announce",
// "udp://tracker.sktorrent.net:6969/announce",
// "udp://tracker.skyts.net:6969/announce",
// "udp://tracker.tiny-vps.com:6969/announce",
// "udp://tracker.yoshi210.com:6969/announce",
// "udp://tracker2.indowebster.com:6969/announce",
// "udp://tracker4.piratux.com:6969/announce", "udp://zer0day.ch:1337/announce","udp://zer0day.to:1337/announce"]
async function tryAnnounceList(torrent, udpSocket, callback) {
  if (isConnected === false) {
    // eslint-disable-next-line no-restricted-syntax
    for (const urlObj of torrent['announce-list']) {
      const url = urlObj.toString('utf8');
      if (isConnected === false) {
        tryToConnect(udpSocket, url, torrent, callback);
      }
      // eslint-disable-next-line no-await-in-loop
      //await waitFor(3000);
    }
    for (const tor of trackers) {
      const urlx = tor.toString('utf8');
      if (isConnected === false) {
        tryToConnect(udpSocket, urlx, torrent, callback);
      }
    }
  }
}

module.exports.getPeers = async (torrent, callback) => {
  const udpSocket = dgram.createSocket('udp4');
   udpSocket.setMaxListeners(1000)

  tryOfficialAnounce(torrent, udpSocket, callback);
  await waitFor(3000);
  tryAnnounceList(torrent, udpSocket, callback);

  if (isConnected === false) {
    // show to the users that none of the trackers are working
    console.error('Could not connect to any tracker');
  }
};
