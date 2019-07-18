// Load Modules
const express = require('express');
const request = require('request-promise');
const sub = require('yifysubtitles-api');
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
