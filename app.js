// Load Modules
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

// Load Own Modules
const torrents = require('./api/torrents');
const leetx = require('./api/leetx');
const yts = require('./api/yts');
const tpb = require('./api/tpb');
const popcorn = require('./api/popcorn');

// Set Engine
const app = express();

// Body Parser Middleware
// Parse app/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}));
// Parse app/json
app.use(bodyParser.json());

// Define routers
app.use('/api/torrents', torrents);
app.use('/api/leetx', leetx);
app.use('/api/yts', yts);
app.use('/api/popcorn', popcorn);

app.get('/tpb', async (req, res) => {
  //let torrents = await tpb.search('pirates', 0, {type: "name", order: "asc"});
  let torrents = await tpb.topTorrents();
  res.status(200).send(torrents);
})

app.get('/leetx', async (req, res) => {
//  let torrents = await leetx.search("pirate", 1, {type: "seeders", order: "desc"});
    let torrents = await leetx.topTorrents();
  res.status(200).send(torrents);
})

const port = process.env.PORT || 8089;
app.listen(port, () => console.log(`Listening on port ${port}...`));
