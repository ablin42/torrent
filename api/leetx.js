// Modules
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request-promise');
const Xray = require('x-ray');
const imdb = require('imdb-api');
const slug = require('slug');

// Set Xray
const xray = Xray();

// Set Engine
const router = express.Router();

// Body Parser Middleware
// Parse app/x-www-form-urlencoded
router.use(bodyParser.urlencoded({extended: false}));
// Parse app/json
router.use(bodyParser.json());

///// LEETX API /////

// fetch torrents  with /:query/:page/:type/:order
router.get('/search/:query/:page/:type/:order', async (req, res) => {
  const query = req.params.query;
  const page = req.params.page;
  const type = req.params.type;
  const order = req.params.order;
  const result = await leetxSearch(query, page, {type:type, order:order});
  let status = 200;

  if (result.status != undefined)
    status = result.status;
  res.status(status).send(result);
})

//fetch the top torrents
router.get('/top', async (req, res) => {
  let result = await topTorrents();
  let status = 200;

  if (result.status != undefined)
    status = result.status;

  res.status(status).send(result);
})

//fetch a specific movie infos and its torrents using its ID
router.get('/movie/:id/:name', async (req, res) => {
  const id = req.params.id;
  const name = req.params.name;
  let result = await searchMovie(id, name);
  let status = 200;

  if (result.status != undefined)
    status = result.status

  res.status(status).send(result);
})

// 1337x.to base URL
let leetxURL = 'http://1337x.to'

// fetch the main info from the listed torrents from the page
async function fetchPageTorrents(reqURL) {
  let torrents = await xray(reqURL, 'table.table-list tr', [{
    name: '.name',
    url: '.name a:nth-child(2)@href',
    seeders: '.seeds',
    leechers: '.leeches',
    date: '.coll-date',
    size: '.size'
  }])
  torrents = torrents.map(e => {e.size = e.size.split('B')[0]; return e;}).filter(e => e.url);

  return torrents;
}

// Get page info used for displaying torrents for each torrent in the array
async function getTorrentsInfo(torrents) {
  await Promise.all(
    torrents.map(async (torrent, index, tab) => {
      torrent.source = "leetx";
      const responseTorrent = await request(torrent.url, {timeout: 1000}).catch(() => {console.log("This page wasnt answering fast enough")});
      torrent.imdbid = responseTorrent.match(/(?<=\:\/\/www\.imdb\.com\/title\/)tt([0-9]+)/g);
      if (torrent.imdbid)
        torrent.imdbid = torrent.imdbid[0];
      torrent.size = torrent.size + "B";
      if (torrent.imdbid != null) {
        torrent.imdb = await imdb.get({id: torrent.imdbid}, {apiKey: 'fea4440e'}).catch(e => console.error(e))
        torrent.name = torrent.imdb.title;
        torrent.rating = torrent.imdb.rating;
        torrent.genre = torrent.imdb.genres.split(", ");
        torrent.year = torrent.imdb.year;
        torrent.runtime = parseInt(torrent.imdb.runtime);
        torrent.language = torrent.imdb.languages.split(", ").map(i => i.toLowerCase().substr(0, 2));
        torrent.img = torrent.imdb.poster;
        torrent.date = torrent.imdb.released;
      } else {
        torrents[index] = null
      }
      date = new Date(torrent.date);
      timestamp = date.getTime();
      torrent.date = timestamp;
      torrent.id = torrent.url.substr(24);
      torrent.seeders = parseInt(torrent.seeders);
      torrent.leechers = parseInt(torrent.leechers);
      torrent.api_url = `api/leetx/movie${torrent.id}`;
      torrent.url = undefined;
      torrent.imdb = undefined;

      if (torrent.size.indexOf("GB") != -1)
        torrent.size = parseFloat(torrent.size) * 1000000000;
      else
        torrent.size = parseFloat(torrent.size) * 1000000;
    })
  ).catch(() => {return torrents.filter(e => e)});
  return torrents.filter(e => e);
}

// Search for a torrent page on leetx, return scraped results
async function leetxSearch(query, page, sort) {
    const allowedType = ["time", "size", "seeders", "leechers"];
    const allowedOrder = ["asc", "desc"];
    let reqURL = `${leetxURL}/category-search/${query}/Movies/${page}/`;

    if (page == 0)
      page = 1;
    if (sort.type === "title" && sort.order === "desc"){
      const reqLastPage = await xray(reqURL, 'body', [{
        lastpage: '.pagination li.last a@href',
        exist: 'table.table-list tr .name'
      }])
      if (reqLastPage.length){
        page = 1;
        if (reqLastPage[0].lastpage)
          page = +reqLastPage[0].lastpage.match(/\/(\d+)\/$/)[1] - page + 1;
      }
    }
    else if (sort.type === "year")
      sort.type = "time"
    else if (sort.type === "rating")
      sort.type = "seeders";
    reqURL = `${leetxURL}/category-search/${query}/Movies/${page}/`;
    if (allowedType.includes(sort.type) && allowedOrder.includes(sort.order))
      reqURL = `${leetxURL}/sort-category-search/${query}/Movies/${sort.type}/${sort.order}/${page}/`;

    console.log(reqURL, page);
    let torrents = await fetchPageTorrents(reqURL);
    if (torrents.length != 0)
        torrents = await getTorrentsInfo(torrents);
    if (torrents.length == 0) {
      torrents = {
        status: 200,
        error: "No content found."
      }}

    return torrents
}

// Return top 100 leetx torrents
async function topTorrents() {
    console.log("leetx: download_count sort");
    let reqURL = `https://1337x.to/top-100-movies`;

    let torrents = await fetchPageTorrents(reqURL);
    if (torrents.length != 0)
        torrents = await getTorrentsInfo(torrents);

    if (torrents.length == 0) {
      torrents = {
        status: 200,
        error: "No content found."
      }}

    return torrents;
}

// Search a specific movie info
async function searchMovie(id, name) {
  let url = `https://1337x.to/torrent/${id}/${name}/`;
  let obj = await xray(url, 'div.no-top-radius', [{
    size: 'div.clearfix > ul:nth-child(2) > li:nth-child(4) > span',
    language: 'div.clearfix > ul:nth-child(2) > li:nth-child(3) > span',
    seeders: '.seeds',
    leechers: '.leeches',
    magnet: 'div.clearfix > ul > li:nth-child(1) > a@href',
    imdbid: '#description',
    date_uploaded: 'div.clearfix > ul:nth-child(3) > li:nth-child(3) > span'
  }])
  if (obj.length == 0) {
    obj = {
      status: 200,
      error: "No content found."
    }
    return obj;
  }
  obj = obj[0];
  obj.seeders = parseInt(obj.seeders);
  obj.leechers = parseInt(obj.leechers);
  obj.language = obj.language.split(", ").map(i => i.substr(0, 2));
  obj.id = `${id}/${name}`;

  if (obj.size.indexOf("GB") != -1)
    size_bytes = parseFloat(obj.size) * 1000000000;
  else
    size_bytes = parseFloat(obj.size) * 1000000;

  if (obj) {
    obj.imdbid = obj.imdbid.match(/(?<=\:\/\/www\.imdb\.com\/title\/)tt([0-9]+)/g);
    if (obj.imdbid) {
      obj.imdbid = obj.imdbid[0];
    }
    if (obj.imdbid != null) {
      obj.imdb = await imdb.get({id: obj.imdbid}, {apiKey: 'fea4440e'}).catch(e => console.error(e))
      obj.name = obj.imdb.title;
      obj.rating = obj.imdb.rating;
      obj.genre = obj.imdb.genres.split(", ");
      obj.year = obj.imdb.year;
      obj.runtime = obj.imdb.runtime;
      //obj.language = obj.imdb.languages.split(", ").map(i => i.substr(0, 2));
      obj.img = obj.imdb.poster;
      obj.description = obj.imdb.plot;
      obj.actors = obj.imdb.actors.split(", ");
      obj.directors = obj.imdb.director.split(", ");
      obj.date = obj.imdb.released;
    }
    else {
      return {
          status: 200,
          error: "No content found."
        }
    }
    obj.slug = slug(obj.name, {lower:true});
    obj.torrents = [{
        url: `https://1337x.to/torrent/${obj.id}`,
        hash: obj.magnet.match(/btih:[a-zA-Z0-9]+/gm)[0].substr(5),
        quality: "",
        type: "",
        seeds: obj.seeders,
        peers: obj.leechers,
        size: obj.size,
        size_bytes: size_bytes,
        date_uploaded: obj.date_uploaded,
        date_uploaded_unix: "",
        magnet: obj.magnet
      }];
    date = new Date(obj.date);
    timestamp = date.getTime();
    obj.date = timestamp;
    obj.date_uploaded = undefined;
    obj.seeders = undefined;
    obj.leechers = undefined;
    obj.size = undefined;
    obj.imdb = undefined;
    obj.magnet = undefined;
    obj.source = "leetx";
  }
  return obj;
}

router.get('*', function(req, res){
  res.status(404).send({status: 404, error: "404 Page Not Found."});
});

module.exports = router;
