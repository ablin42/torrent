// Modules
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request-promise');
const Xray = require('x-ray');
const imdb = require('imdb-api');

// Set Xray
const xray = Xray();

// Set Engine
const router = express.Router();

// Body Parser Middleware
// Parse app/x-www-form-urlencoded
router.use(bodyParser.urlencoded({extended: false}));
// Parse app/json
router.use(bodyParser.json());


router.get('/search/:query/:page/:type/:order', async (req, res) => {
  const query = req.params.query;
  const page = req.params.page;
  const type = req.params.type;
  const order = req.params.order;

  const result = await leetxSearch(query, page, {type:type, order:order});
  res.status(200).send(result);
})

router.get('/top', async (req, res) => {
  result = await topTorrents();

  res.status(200).send(result);
})

router.get('/movie/:id/:name', async (req, res) => {
  const id = req.params.id;
  const name = req.params.name;
  result = await searchMovie(id, name);
  if (result)
    result.source = "leetx";
  else
    result = "Wrong combination of ID and name";

  res.status(200).send(result);
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
  torrents = torrents.map(e => {e.size = e.size.split('B')[0]; return e;}).filter(e => e.url)
  return torrents;
}

// Get page info for each torrent in the array
async function getTorrentsInfo(torrents) {
  await Promise.all(
    torrents.map(async (torrent, index, tab) => {
      torrent.source = "leetx";
      const responseTorrent = await request(torrent.url);
      torrent.imdbid = responseTorrent.match(/(?<=\:\/\/www\.imdb\.com\/title\/)tt([0-9]+)/g);
      if (torrent.imdbid)
        torrent.imdbid = torrent.imdbid[0];
      torrent.size = torrent.size + "B";
      if (torrent.imdbid != null) {
        torrent.imdb = await imdb.get({id: torrent.imdbid}, {apiKey: 'fea4440e'}).catch(e => console.error(e))
        torrent.name = torrent.imdb.title;
        torrent.rating = torrent.imdb.rating;
        torrent.genre = torrent.imdb.genres;
        torrent.year = torrent.imdb.year;
        torrent.runtime = torrent.imdb.runtime;
        torrent.language = torrent.imdb.languages;
        torrent.img = torrent.imdb.poster;
      }
      else {
        torrents[index] = null
      }
      torrent.imdb = undefined;
    })
  );
  return torrents.filter(e => e);
}

// Search for a torrent page on leetx, return scraped results
async function leetxSearch(query, page, sort) {
    let reqURL = `${leetxURL}/category-search/${query}/Movies/${page}/`;
    if (sort.type === "name" && sort.order === "desc"){
      const reqLastPage = await xray(reqURL, 'body', [{
        lastpage: '.pagination li.last a@href',
        exist: 'table.table-list tr .name'
      }])
      if (reqLastPage.length)
      {
        page = 1;
        if (reqLastPage[0].lastpage)
          page = +reqLastPage[0].lastpage.match(/\/(\d+)\/$/)[1] - page + 1;
      }
    }
    reqURL = `${leetxURL}/category-search/${query}/Movies/${page}/`;
    if (sort.type !== undefined && sort.type !== "name")
      reqURL = `${leetxURL}/sort-category-search/${query}/Movies/${sort.type}/${sort.order}/${page}/`;
    console.log(reqURL, page);

    try {
     let torrents = await fetchPageTorrents(reqURL);
     torrents = await getTorrentsInfo(torrents);
     return torrents
    } catch (error) {return Promise.reject(error);}
}

// Return top 100 leetx torrents
async function topTorrents() {
    let reqURL = `https://1337x.to/top-100-movies`;

    try {
      let torrents = await fetchPageTorrents(reqURL);
      torrents = await getTorrentsInfo(torrents);
      return torrents;
    } catch (error) {return Promise.reject(console.error());}
}

// Search a specific movie info
async function searchMovie(id, name) {
  let url = `https://1337x.to/torrent/${id}/${name}/`;
  let obj = await xray(url, '.box-info-detail.no-top-radius', [{
    size: 'div.torrent-category-detail.clearfix > ul:nth-child(2) > li:nth-child(4) > span',
    language: 'div.torrent-category-detail.clearfix > ul:nth-child(2) > li:nth-child(3) > span',
    seeders: '.seeds',
    leechers: '.leeches',
    magnet: 'div.torrent-category-detail.clearfix > ul.download-links-dontblock.btn-wrap-list > li:nth-child(1) > a@href',
    imdbid: '#description'
  }])
  obj = obj[0];

  if (obj) {
    obj.imdbid = obj.imdbid.match(/(?<=\:\/\/www\.imdb\.com\/title\/)tt([0-9]+)/g);
    if (obj.imdbid) {
      obj.imdbid = obj.imdbid[0];
    }

    if (obj.imdbid != null) {
      obj.imdb = await imdb.get({id: obj.imdbid}, {apiKey: 'fea4440e'}).catch(e => console.error(e))
      obj.name = obj.imdb.title;
      obj.rating = obj.imdb.rating;
      obj.genre = obj.imdb.genres;
      obj.year = obj.imdb.year;
      obj.runtime = obj.imdb.runtime;
      obj.language = obj.imdb.languages;
      obj.img = obj.imdb.poster;
      obj.plot = obj.imdb.plot;
      obj.actors = obj.imdb.actors;
      obj.director = obj.imdb.director;
    }
    else {
      return "This movie doesnt have IMDB info";
    }
    obj.imdb = undefined;
  }
  return obj;
}

module.exports = router;

// module.exports = {
//   // Search for a torrent page on leetx, return scraped results
//   search: async function(query, page, sort) {
//     let reqURL = `${leetxURL}/category-search/${query}/Movies/${page}/`;
//     if (sort.type === "name" && sort.order === "desc"){
//       const reqLastPage = await xray(reqURL, 'body', [{
//         lastpage: '.pagination li.last a@href',
//         exist: 'table.table-list tr .name'
//       }])
//       if (reqLastPage.length)
//       {
//         page = 1;
//         if (reqLastPage[0].lastpage)
//           page = +reqLastPage[0].lastpage.match(/\/(\d+)\/$/)[1] - page + 1;
//       }
//     }
//     reqURL = `${leetxURL}/category-search/${query}/Movies/${page}/`;
//     if (sort.type !== undefined && sort.type !== "name")
//       reqURL = `${leetxURL}/sort-category-search/${query}/Movies/${sort.type}/${sort.order}/${page}/`;
//     console.log(reqURL, page);
//
//     try {
//      let torrents = await fetchPageTorrents(reqURL);
//      torrents = await getTorrentsInfo(torrents);
//      return torrents
//     } catch (error) {return Promise.reject(error);}
//   },
//   // Return top 100 leetx torrents
//   topTorrents: async function() {
//     let reqURL = `https://1337x.to/top-100-movies`;
//
//     try {
//       let torrents = await fetchPageTorrents(reqURL);
//       torrents = await getTorrentsInfo(torrents);
//       return torrents;
//     } catch (error) {return Promise.reject(console.error());}
//   }
// }
