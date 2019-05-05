// Load Modules
const express = require('express');

// Load Own Modules
const leetx = require('./leetx')
const tpb = require('./tpb')

// Set Engine
const router = express.Router();

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
  leetxTop = leetx.topTorrents();
  tpbTop = tpb.topTorrents();

  [leetxTop, tpbTop] = [await leetxTop, await tpbTop]
  sortedResult = [...leetxTop, ...tpbTop].sort(function(a, b){return b.seeders - a.seeders});
  if (sortedResult.length === 0)
    return "No content found, please try again later.";
  return sortedResult;
}

async function searchTorrents(query, page, type, order) {
  const allowedType = ["name", "time", "size", "seeders", "leechers"];
  const allowedOrder = ["asc", "desc"];
  let sort = {};
  if (type && order) {
    sort = {"type": type, "order": order};
  }
  if (page < 0)
    return "Invalid page number";
  if (allowedType.indexOf(type) != -1 && allowedOrder.indexOf(order) != -1 || !sort){
    let leetxTorrents = leetx.search(query, page + 1, sort);
    let tpbTorrents =  tpb.search(query, page, sort);

    [leetxTorrents, tpbTorrents] = [await leetxTorrents, await tpbTorrents]
    //sortedResult = [...leetxTorrents, ...tpbTorrents].sort(nameSort);
    sortedResult = [...leetxTorrents, ...tpbTorrents]//.sort(function (a, b){return a.name - b.name});
    if (sortedResult.length === 0)
      return "No content found";
    return sortedResult
  }
  return "Wrong parameters.";
}

function dynamicSort(property) {
    var sortOrder = 1;
    if(property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a,b) {
        /* next line works with strings and numbers,
         * and you may want to customize it to your needs
         */
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    }
}

function typeSort(a, b, type){
  if (a[type] < b[type]) return -1;
	else if (a[type] == b[type]) return 0;
	else return 1;
}

// Sort by name, ascending
function nameSort(a, b){
  if (a.name < b.name) return -1;
	else if (a.name == b.name) return 0;
	else return 1;
}

module.exports = router;
