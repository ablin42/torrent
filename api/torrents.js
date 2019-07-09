// Load Modules
const express = require('express');
const request = require('request-promise');
const sub = require('yifysubtitles-api');
const Client = require('node-torrent');
const client = new Client({logLevel: 'DEBUG'});
const AdmZip = require('adm-zip')
const http = require('http');
const fs = require('fs');

const glob = require('glob');

// Load Own Modules
// const leetx = require('./leetx')
// const tpb = require('./tpb')

// Set Engine
const router = express.Router();

const BaseUrl = "http://localhost:8089/api";

// Fetch info from query, ask tpb and leetx and return the result sorted by name
router.get('/search/:query/:page/:type/:order', async (req, res) => {
  const query = req.params.query,
        page  = req.params.page,
        type  = req.params.type,
        order = req.params.order;
  let result = await searchTorrents(query, page, type, order);
  let status = 200;

  if (result.status != undefined)
    status = result.status;

  res.status(status).send(result);
})

// Fetch top 100 torrents from tpb and leetx and return the result sorted by seeders
router.get('/top', async (req, res) => {
  let result = await topTorrents();
  let status = 200;

  if (result.status != undefined)
    status = result.status;

  res.status(status).send(result);
})

router.get('/sub/:imdbid', async (req, res) => {
  const imdbid = req.params.imdbid;
  let result = await sub.search({imdbid:imdbid, limit:'best'});
  let status = 200;

  if (Object.entries(result).length === 0 && result.constructor === Object)
    result = {status: 200, error: "No content found."}
  if (result.status != undefined)
    status = result.status;

  res.status(status).send(result);
})

//Download subtitles for a movie in specified language
router.get('/getsub/:imdbid/:lang', async (req, res) => {
  const imdbid = req.params.imdbid;
  const userLanguage = req.params.lang;
  const subtitles = await request({"uri":`${BaseUrl}/torrents/sub/${imdbid}`, "json": true});
  let subUrl = undefined;
  let subName = undefined;

  if (!subtitles.status){
    Object.values(subtitles).forEach((language, index) => {
       for (let track of language) {
         if (track.langName === userLanguage) {
           subUrl = track.url;
           subName = track.release;
           break;
         }
       }
    })
    if (subUrl && subName) {
      if (!fs.existsSync('./sub')) {
        fs.mkdirSync('./sub');
      }

      let dir = `./sub/${subName}`;
      if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir);
      }
      request(subUrl)
        .pipe(fs.createWriteStream(`./sub/${subName}/${subName}-${userLanguage}.zip`))
        .on('error', (err) => console.log)
        .on('close', () => {
          let zip = new AdmZip(`./sub/${subName}/${subName}-${userLanguage}.zip`);
          zip.extractAllTo(`./sub/${subName}/${userLanguage}`, true);
          glob(`./sub/**/${userLanguage}/*.srt`, {}, (err, file) => {
            fs.rename(file[0], `./sub/${subName}/${userLanguage}/${userLanguage}-subtitles.srt`, () => {});
          })
          console.log('Zip downloaded and extracted!')
        })
    }
    else {
        res.status(200).send("No subtitles found for this language");
        return ;
    }
  }
  res.status(200).send(subtitles);
})

router.get('/download', async (req, res) => {
  torrent =  client.addTorrent('magnet:?xt=urn:btih:2830A64B1D825D5ACFE76A40BD13583D2260A04F&dn=Avengers.Endgame.2019.HDTC.SPECIAL-1337x-EDITION.x264-GalaxyRG&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969%2Fannounce&tr=udp%3A%2F%2Fexodus.desync.com%3A6969&tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337%2Fannounce&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80%2Fannounce&tr=udp%3A%2F%2Fexplodie.org%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&tr=udp%3A%2F%2Ftracker.tiny-vps.com%3A6969%2Fannounce&tr=udp%3A%2F%2Fopen.demonii.si%3A1337%2Fannounce&tr=udp%3A%2F%2Ftracker.torrent.eu.org%3A451%2Fannounce&tr=udp%3A%2F%2Ftracker.pirateparty.gr%3A6969%2Fannounce&tr=udp%3A%2F%2Fipv4.tracker.harry.lu%3A80%2Fannounce&tr=udp%3A%2F%2Ftracker.cyberia.is%3A6969%2Fannounce&tr=udp%3A%2F%2F9.rarbg.to%3A2710%2Fannounce&tr=udp%3A%2F%2Ftracker.zer0day.to%3A1337%2Fannounce&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969%2Fannounce&tr=udp%3A%2F%2Fcoppersurfer.tk%3A6969%2Fannounce');

  // when the torrent completes, move it's files to another area
torrent.on('complete', function() {
    console.log('complete!');
    torrent.files.forEach(function(file) {
        var newPath = '/new/path/' + file.path;
        fs.rename(file.path, newPath);
        // while still seeding need to make sure file.path points to the right place
        file.path = newPath;
    });
    res.status(200).send();
});

})

//function toptorrents and search
async function topTorrents () {
  let leetxTop = await request({"uri":`${BaseUrl}/leetx/top`, "json": true}),
      ytsTop = await request({"uri":`${BaseUrl}/yts/top`, "json": true}),
      popcornTop = await request({"uri":`${BaseUrl}/popcorn/top`, "json": true});

  if (leetxTop.status && (ytsTop.status == undefined || popcornTop.status == undefined))
    leetxTop = [];
  if (ytsTop.status && (leetxTop.status == undefined || popcornTop.status == undefined))
    ytsTop = [];
  if (popcornTop.status && (ytsTop.status == undefined || leetxTop.status == undefined))
    popcornTop = [];
  if (popcornTop.status && ytsTop.status && leetxTop.status)
    return result = {status: 200, error: "No content found."};

  joinedTop = [...popcornTop, ...ytsTop, ...leetxTop];
  sortedResult = removeExtra(joinedTop);

  //sortedResult = [...leetxTop, ...tpbTop].sort(function(a, b){return b.seeders - a.seeders});
  if (sortedResult.length === 0)
    return {status: 200, error: "No content found."};
  return sortedResult;
}

async function searchTorrents(query, page, type, order) {
  const allowedType = ["title", "year", "seeders", "leechers", "rating"];
  const allowedOrder = ["asc", "desc"];

  if (page < 0)
    return {status: 200, error: "No content found."};
  else if (page == 0)
    page = 1;
  if (allowedType.includes(type) && allowedOrder.includes(order)){
    let leetxTorrents = await request({"uri":`${BaseUrl}/leetx/search/${query}/${+page}/${type}/${order}`, "json": true});
    let ytsTorrents = await request({"uri":`${BaseUrl}/yts/search/${query}/${page}/${type}/${order}`, "json": true});
    let popcornTorrents = await request({"uri":`${BaseUrl}/popcorn/search/${query}/${page}/${type}/${order}`, "json": true});

    if (leetxTorrents.status && (ytsTorrents.status == undefined || popcornTorrents.status == undefined))
      leetxTorrents = [];
    if (ytsTorrents.status && (leetxTorrents.status == undefined || popcornTorrents.status == undefined))
      ytsTorrents = [];
    if (popcornTorrents.status && (ytsTorrents.status == undefined || leetxTorrents.status == undefined))
      popcornTorrents = [];
    if (popcornTorrents.status && ytsTorrents.status && leetxTorrents.status)
      return result = {status: 200, error: "No content found."};

    let sortType = "";
    if (order === "desc")
      sortType += "-";
    sortType += type;

    sortedResult = [...popcornTorrents, ...ytsTorrents, ...leetxTorrents];
    console.log(`Before removing same extra movies: ${sortedResult.length}`)
    sortedResult = removeExtra(sortedResult);
    console.log(`After removing same extra movies: ${sortedResult.length}`)

    sortedResult = sortedResult.sort(dynamicSort(sortType));
    if (sortedResult.length === 0)
      return {status: 200, error: "No content found."};
    return sortedResult;
  }
  return {status: 200, error: "Wrong Parameters"};
}

function removeExtra(torrents) {
  let result = [],
      imdbFetched = [];
  torrents.forEach((item, index) => {
    if (!imdbFetched.includes(item.imdbid)) {
      result.push(item);
      imdbFetched.push(item.imdbid);
    }
  })
  return result;
}

function dynamicSort(property) {
    var sortOrder = 1;
    if(property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a,b) {
        let  result = a[property] - b[property]
        return result * sortOrder;
    }
}

router.get('*', function(req, res){
  res.status(404).send({status: 404, error: "404 Page Not Found."});
});

module.exports = router;
