// Modules
const request = require('request-promise')
const Xray = require('x-ray')
const imdb = require('imdb-api')

const xray = new Xray();

// thepiratebay base URL
let pirateURL = 'https://thepiratebay.org'

// fetch the main info from the listed torrents from the page
async function fetchPageTorrents(reqURL) {
  const torrents = await xray(reqURL, '#searchResult tr', [{
    name: '.detName .detLink',
    url: '.detName .detLink@href',
    rawMagnet: 'td:nth-child(2) a:nth-child(2)@href',
    seeders: 'td:nth-child(3)',
    leechers: 'td:nth-child(4)'
  }])

  return torrents;
}

// Get page info for each torrent in the array
async function getTorrentsInfo(torrents) {
  await Promise.all(
    torrents.map(async (torrent, index) => {
      torrent.img = null;
      torrent.imdb = null;
      torrent.imdbid = null;
      const responseTorrent = await request(torrent.url);
      torrent.url = null;
      torrent.imdbid = responseTorrent.match(/(?<=https?\:\/\/www\.imdb\.com\/title\/)tt(.[0-9]+)/g);
      if (torrent.imdbid != null) {
        torrent.imdb = await imdb.get({id: torrent.imdbid[0]}, {apiKey: 'fea4440e'}).catch(e => console.error(e))
      }
    })
  );
  return torrents;
}

module.exports = {
  // Search for a torrent page on tpb, return scraped results
  search: async function(query, page, sort) {
    let sortType = {
      "nameasc": 1,
      "namedesc": 2,
      "timeasc": 3,
      "timedesc": 4,
      "sizeasc": 5,
      "sizedesc": 6,
      "seedersasc": 7,
      "seedersdesc": 8,
      "leechersasc": 9,
      "leechersdesc": 10
    }
    sort = sortType[sort.type+sort.order];
    if (sort === undefined)
      sort = 1;
    let reqURL = `${pirateURL}/search/${query}/${page}/${sort}/200/`;

      console.log(reqURL);
    try {
       let torrents = await fetchPageTorrents(reqURL);
       torrents = await getTorrentsInfo(torrents);
       return torrents
    } catch (error) {return Promise.reject(error);}
  },
  // Return top 100 tpb torrents
  topTorrents: async function() {
    let reqURL = `https://thepiratebay.org/top/200`;

    try {
      let torrents = await fetchPageTorrents(reqURL);
      torrents = await getTorrentsInfo(torrents);
      return torrents;
    } catch (error) {return Promise.reject(console.error());}
  }
}
