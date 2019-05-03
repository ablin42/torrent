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
  search.searchTorrent("pirate", 0);
  res.status(200).send();
})

app.get('/tpb', async (req, res) => {
                                    //req.body.query
  var query = await PirateBay.search("Game of Thrones", {
  category: 'video', // You can also use the category number: `/search/0/99/{category_number}`
  filter: {
    verified: false    // default - false | Filter all VIP or trusted torrents
  },
  page: 0,            // default - 0 - 99
  orderBy: 'name', // default - name, date, size, seeds, leeches
  sortBy: 'desc'      // default - desc, asc
  });
  res.render('index', {
      torrents: query
    });
  //res.status(200).send();
})

app.get('/test', async (req, res) => {

  var torrents = await leetx.search("pirate", 1);//, function(err, results) {
    torrents.forEach((item, index) => {
      console.log(item.imdb);
    }) // returns name, seeders, leechers, url
//  })
//console.log(torrents);

  res.status(200).send();
})

app.get('/1337', async (req, res) => {
  TorrentSearchApi.enableProvider('1337x');
  const torrents = await TorrentSearchApi.search('1080', 'Movies', 20);
  const detail = await TorrentSearchApi.getTorrentDetails(torrents[0])
  console.log(detail)
  //console.log(torrents);
  res.status(200).send(torrents);
})

const port = process.env.PORT || 8089;
app.listen(port, () => console.log(`Listening on port ${port}...`));
