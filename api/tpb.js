// Modules
const request = require('request-promise')
const Xray = require('x-ray')
const imdb = require('imdb-api')

const xray = new Xray();

// thepiratebay base URL
let pirateURL = 'https://thepiratebay.org'

 async function loopThroughTorrent($) {
  //const torrents = [];

  const torrents = await xray($, '#searchResult tr', [{
    name: '.detName .detLink',
    url: '.detName .detLink@href',
    rawMagnet: 'td:nth-child(2) a:nth-child(2)@href',
    seeders: 'td:nth-child(3)',
    leechers: 'td:nth-child(4)'
  }])

  return torrents;
}

async function getImdb(torrents) {
  await Promise.all(
    torrents.map(async (torrent, index) => {
      torrents[index].img = null;
      torrents[index].imdb = null;
      torrents[index].imdbid = null;
      const responseTorrent = await request(pirateURL + torrent.url);
      torrent.imdbid = responseTorrent.match(/(?<=https?\:\/\/www\.imdb\.com\/title\/)tt(.{7})/g);
      if (torrents[index].imdbid != null) {
        torrents[index].imdb = await imdb.get({id: torrents[index].imdbid[0]}, {apiKey: 'fea4440e'}).catch(e => console.error(e))
      }
    })
  );
  return torrents;
}

module.exports = {
  search: async function(query, page, sort) {
    let sortType = {
      "timeasc": 7,
      
    }
    let reqURL = `${pirateURL}/search/${query}/${page}/${sortType[sort.type+sort.order]}/200/`;
    try {
     const response = await request(reqURL);

     let torrents = await loopThroughTorrent(response);
     torrents = await getImdb(torrents);
     return torrents

    } catch (error) {return Promise.reject(error);}

  },
  topTorrents: async function() {
    let reqURL = `https://1337x.to/top-100-movies`;

    const response = await request(reqURL);
    const $ = cheerio.load(response);
    let torrents = await loopThroughTorrent($);
    torrents = await getTorrentsImg(torrents);
    result = await Promise.all(
        [response, $, torrents]).then(function() {
          return torrents;
        });
    return result;
  }
}
