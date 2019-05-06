// Modules
const request = require('request-promise')
const Xray = require('x-ray')
const imdb = require('imdb-api')

const xray = new Xray();

// 1337x.to base URL
let leetxURL = 'http://1337x.to'

// fetch the main info from the listed torrents from the page
async function fetchPageTorrents(reqURL) {
  let torrents = await xray(reqURL, 'table.table-list tr', [{
    name: '.name',
    url: '.name a:nth-child(2)@href',
    seeders: '.seeds',
    leechers: '.leeches',
    date: '.coll-date'
  }])

  torrents = torrents.filter(e => e.url)
  return torrents;
}

// Get page info for each torrent in the array
async function getTorrentsInfo(torrents) {
  await Promise.all(
    torrents.map(async (torrent, index) => {
      torrent.img = null;
      torrent.imdb = null;
      const arr = await xray(torrent.url, 'body', [{
        imdbid: "#description",
        img: "#description img.descrimg@data-original",
        rawMagnet: "div.torrent-category-detail > ul.download-links-dontblock > li:nth-child(1) > a@href"
      }])
      torrent.url = undefined;
      torrent.imdbid = arr[0].imdbid.match(/(?<=https?\:\/\/www\.imdb\.com\/title\/)tt(.[0-9]+)/g);
      torrent.rawMagnet = arr[0].rawMagnet;
      if (torrent.imdbid != null) {
        torrent.imdb = await imdb.get({id: torrent.imdbid[0]}, {apiKey: 'fea4440e'}).catch(e => console.error(e))
        torrent.rating = torrent.imdb.rating;
        torrent.genre = torrent.imdb.genres;
        torrent.year = torrent.imdb.year;
        torrent.released = torrent.imdb.released;
      }
      else {
        torrent.img = arr[0].img;
      }
    })
  );
  return torrents;
}

module.exports = {
  // Search for a torrent page on leetx, return scraped results
  search: async function(query, page, sort) {
    let reqURL = `${leetxURL}/category-search/${query}/Movies/${page}/`;
    if (sort.type !== undefined && sort.type !== "name")
      reqURL = `${leetxURL}/sort-category-search/${query}/Movies/${sort.type}/${sort.order}/${page}/`;
    console.log(reqURL);

    try {
     let torrents = await fetchPageTorrents(reqURL);
     torrents = await getTorrentsInfo(torrents);
     return torrents
    } catch (error) {return Promise.reject(error);}
  },
  // Return top 100 leetx torrents
  topTorrents: async function() {
    let reqURL = `https://1337x.to/top-100-movies`;

    try {
      let torrents = await fetchPageTorrents(reqURL);
      torrents = await getTorrentsInfo(torrents);
      return torrents;
    } catch (error) {return Promise.reject(console.error());}
  }
}
