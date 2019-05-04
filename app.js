const express = require('express');
const app = express();
const path = require('path');
const TorrentSearchApi = require('torrent-search-api');
const bodyParser = require('body-parser');
const PirateBay = require('thepiratebay');
const pug = require('pug');
const torrents = require('./api/torrents');
const leetx = require('./api/leetx')
const search = require('./search-torrent')
const tpb = require('./api/tpb');

const imdb = require('imdb-api');

// Load View Engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Set Public Folder
app.use(express.static(path.join(__dirname, 'public')));

// Body Parser Middleware
// Parse app/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}));
// Parse app/json
app.use(bodyParser.json());

// Define posts router
app.use('/api/torrents', torrents);

app.get('/both', (req, res) => {
  search.searchTorrent("pirates", 0);
  res.status(200).send();
})

app.get('/tpb', async (req, res) => {
  let torrents = await tpb.search('pirates', 0);
  res.status(200).send(torrents);
})

app.get('/test', async (req, res) => {

  let torrents = await leetx.search("pirate", 1, {});
  res.status(200).send(torrents);
})

const port = process.env.PORT || 8089;
app.listen(port, () => console.log(`Listening on port ${port}...`));
