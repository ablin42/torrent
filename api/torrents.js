const express = require('express');
const router = express.Router();
const PirateBay = require('thepiratebay');
const leetx = require('./leetx')


//fetch info from query, fetch the page and return its torrents
router.get('/search/:q/:p', async (req, res) => {
  let query = req.params.q,
      page = req.params.p;

  const leetxTorrents = await leetx.search(query, page + 1)
  const tpbTorrents = await PirateBay.search(query, {
  category: 'video', // You can also use the category number: `/search/0/99/{category_number}`
  filter: {
    verified: false    // default - false | Filter all VIP or trusted torrents
  },
  page: req.params.p,            // default - 0 - 99
  orderBy: 'name', // default - name, date, size, seeds, leeches
  sortBy: 'desc'      // default - desc, asc
  });

  result = torrentToObject(leetxTorrents, tpbTorrents);
  sortedResult = result.sort(nameSort);
  res.status(200).send(sortedResult);
})

router.get('/top', async (req, res) => {
  torrents = await topTorrents();
  res.status(200).send(torrents);
})

router.get('/:id', async (req, res) => {
  const query = await PirateBay.getTorrent(req.params.id);
  if (query.id === undefined)
    res.status(400).send("ERROR 404: There is no torrent with this ID");
  else
    res.status(200).send(query);
})



async function topTorrents() {
  leetxTop = await leetx.topTorrents();
  tpbTop = await PirateBay.topTorrents(200);//category (200 = hd - tv shows)

  result = torrentToObject(leetxTop, tpbTop);
  sortedResult = result.sort(function(a, b){return b.seeders - a.seeders})
  return sortedResult;
}

function torrentToObject(leetxTorrents, tpbTorrents) {
  let result = [];

  leetxTorrents.forEach((item, index) => {
    let obj = {};

    obj.name = item.name;
    obj.date = item.date;
    obj.url = item.url;
    obj.img = item.img;
    obj.size = item.size;
    obj.seeders = item.seeders;
    obj.leechers = item.leechers;
    result.push(obj);
  })

  tpbTorrents.forEach((item, index) => {
    let obj = {};

    obj.name = item.name;
    obj.date = item.uploadDate;
    obj.url = item.link;
    obj.img = ""; //get img?
    obj.size = item.size;
    obj.seeders = item.seeders;
    obj.leechers = item.leechers;
    result.push(obj);
  })
  return result;
}

function nameSort(a, b){
	if (a.name < b.name) return -1;
	else if (a.name == b.name) return 0;
	else return 1;
}

function queryToHtml (query) {
  let result = "";
  query.forEach((query) => {
      result += `<div class="torrent-container">
                  <p class="torrent-name">${query.name}</p>
                  <a href="${query.link}" class="torrent-link"> link </a>
                  <i class="torrent-date">upload date ${query.uploadDate}</i>
                  </div>`;
  })
  return result;
}

module.exports = router;
