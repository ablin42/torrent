const express = require('express');
const router = express.Router();
const PirateBay = require('thepiratebay');
const leetx = require('./leetx')
const tpb = require('./tpb')

//fetch info from query, fetch the page and return its torrents
router.get('/search/:q/:p', async (req, res) => {
  let query = req.params.q,
      page = req.params.p;

  let leetxTorrents = await leetx.search(query, page + 1, {})
      leetxTorrents = await [...leetxTorrents, ...await leetx.search(query, page + 2, {})];
        leetxTorrents = await [...leetxTorrents, ...await leetx.search(query, page + 3, {})];
          leetxTorrents = await [...leetxTorrents, ...await leetx.search(query, page + 4, {})];
  // let tpbTorrents = await tpb.search(query, page, {});
  //   tpbTorrents = [...tpbTorrents, await tpb.search(query, page + 1, {})];
  //     tpbTorrents = [...tpbTorrents, await tpb.search(query, page + 2, {})];
  //       tpbTorrents = [...tpbTorrents, await tpb.search(query, page + 2, {})];

  let tpbTorrents = []
  sortedResult = [...leetxTorrents, ...tpbTorrents].sort(nameSort);
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

  sortedResult = [...leetxTop, ...tpbTop].sort(function(a, b){return b.seeders - a.seeders})
  return sortedResult;
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
