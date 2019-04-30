const express = require('express');
const router = express.Router();
const PirateBay = require('thepiratebay');


//fetch info from query, fetch the page and return its torrents
router.get('/search/:q/:p', async (req, res) => {
  console.log(req.params);
  const query = await PirateBay.search(req.params.q, {
  category: 'video', // You can also use the category number: `/search/0/99/{category_number}`
  filter: {
    verified: false    // default - false | Filter all VIP or trusted torrents
  },
  page: req.params.p,            // default - 0 - 99
  orderBy: 'name', // default - name, date, size, seeds, leeches
  sortBy: 'desc'      // default - desc, asc
  });
  res.status(200).send(queryToHtml(query));
})

router.get('/:id', async (req, res) => {
  const query = await PirateBay.getTorrent(req.params.id);
  if (query.id === undefined)
    res.status(400).send("ERROR 404: There is no torrent with this ID");
  else
    res.status(200).send(query);
})

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
