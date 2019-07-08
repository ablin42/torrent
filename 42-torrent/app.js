'use strict';

const tracker = require('./tracker');//
const torrentParser = require('./torrent-parser');
const download = require('./download');

const torrent = torrentParser.open('test.torrent');

// tracker.getPeers(torrent, peers => {
//   console.log('list of peers: ', peers);
// });

download(torrent, torrent.info.name);
