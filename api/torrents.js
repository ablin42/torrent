// Load Modules
const express = require('express');
const request = require('request-promise');

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
