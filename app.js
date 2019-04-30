const express = require('express');
const app = express();
const path = require('path');
const TorrentSearchApi = require('torrent-search-api');
const bodyParser = require('body-parser');
const PirateBay = require('thepiratebay');
const pug = require('pug');
const torrents = require('./api/torrents');

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


app.post('/', async (req, res) => {

async function searchTorrent (query, type, amount) {
  console.log(query, type, amount);
  try {
    var torrents = await TorrentSearchApi.search(query, type, amount);
  } catch (e) {
    console.log(`error: ${e}`);
  }
  return (torrents);
}

async function detailTorrent(torrent) {
  try {
    var details = await TorrentSearchApi.getTorrentDetails(torrent);
  } catch (e) {
    console.log(`error: ${e}`);
  }
  return (details);
}

    torrents = await searchTorrent(req.body.query, req.body.type, req.body.amount);
    //torrents.sort((a, b) => (a.seeds > b.seeds) ? 1 : -1);
    for (var i = 0, len = torrents.length; i < len; i++){
      console.log(`${i} - ${torrents[i].seeds} - ${torrents[i].title} - ${torrents[i].provider}`);
    }
  //  console.log(torrents);
  //  details = await detailTorrent(torrents[0]);
  //  console.log(details);
    res.status(200).send();
});
const port = process.env.PORT || 8089;
app.listen(port, () => console.log(`Listening on port ${port}...`));
