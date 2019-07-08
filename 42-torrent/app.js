'use strict';

const torrentParser = require('./torrent-parser');
const download = require('./download');

const torrent = torrentParser.open('wow.torrent');
console.log(torrent.info.name.toString())
// tracker.getPeers(torrent, peers => {
//   console.log('list of peers: ', peers);
// });

download(torrent, torrent.info.name);
