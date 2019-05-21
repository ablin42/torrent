// Load Modules
const express = require('express');
const request = require('request-promise');

// Load Own Modules
const leetx = require('./leetx')
const tpb = require('./tpb')

// Set Engine
const router = express.Router();

const BaseUrl = "http://localhost:8089/api";

// Fetch info from query, ask tpb and leetx and return the result sorted by name
router.get('/search/:query/:page/:type/:order', async (req, res) => {
  const query = req.params.query,
        page  = req.params.page,
        type  = req.params.type,
        order = req.params.order;

  result = await searchTorrents(query, page, type, order);
  res.status(200).send(result);
})

// Fetch top 100 torrents from tpb and leetx and return the result sorted by seeders
router.get('/top', async (req, res) => {
  result = await topTorrents();
  res.status(200).send(result);
})

//function toptorrents and search
async function topTorrents () {
  let leetxTop = await request({"uri":`${BaseUrl}/leetx/top`, "json": true}),
      ytsTop = await request({"uri":`${BaseUrl}/yts/top`, "json": true});

  sortedResult = [...ytsTop, ...leetxTop];
  console.log(sortedResult.length)
  //sortedResult = [...leetxTop, ...tpbTop].sort(function(a, b){return b.seeders - a.seeders});
  if (sortedResult.length === 0)
    return "No content found, please try again later.";
  return removeExtra(sortedResult);
}

async function searchTorrents(query, page, type, order) {
  const allowedType = ["name", "size", "seeders", "leechers", "rating"];
  const allowedOrder = ["asc", "desc"];

  if (+page < 0)
    return "Invalid page number";
  if (allowedType.includes(type) && allowedOrder.includes(order)){
    let leetxTorrents = await request({"uri":`${BaseUrl}/leetx/search/${query}/${+page}/${type}/${order}`, "json": true});
    let ytsTorrents = await request({"uri":`${BaseUrl}/yts/search/${query}/${+page}/${type}/${order}`, "json": true});

  //  let leetxTorrents = leetx.search(query, +page + 1, sort);//
  //  let tpbTorrents = tpb.search(query, +page, sort);//
    // let sortType = "";
    // if (order === "desc")
    //   sortType += "-";
    // sortType += type;

    sortedResult = [...ytsTorrents, ...leetxTorrents];
    console.log(sortedResult.length)

    //sortedResult = [...leetxTorrents, ...ytsTorrents];//.sort(dynamicSort(sortType));
    if (sortedResult.length === 0)
      return "No content found";
    return removeExtra(sortedResult);
  }
  return "Wrong parameters.";
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
  console.log(result.length);
  return result;
}
//
// function dynamicSort(property) {
//     var sortOrder = -1;
//     if(property[0] === "-") {
//         sortOrder = -1;
//         property = property.substr(1);
//     }
//     return function (a,b) {
//         let  result = a[property] - b[property]
//         return result * sortOrder;
//     }
// }
//
// function typeSort(a, b, type){
//   if (a[type] < b[type]) return -1;
// 	else if (a[type] == b[type]) return 0;
// 	else return 1;
// }
//
// // Sort by name, ascending
// function nameSort(a, b){
//   if (a.name < b.name) return -1;
// 	else if (a.name == b.name) return 0;
// 	else return 1;
// }

module.exports = router;
