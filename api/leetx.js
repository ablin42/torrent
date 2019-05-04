// Modules
const request = require('request-promise')
const cheerio = require('cheerio')
const Xray = require('x-ray')
const imdb = require('imdb-api')

const xray = new Xray();


// 1337x.to base URL
let leetxURL = 'http://1337x.to'

function loopThroughTorrent($) {
  const torrents = [];

  // eslint-disable-next-line func-names
  $('table.table-list tr').each(function (index, item) {
    let torrent = {};
    torrent.name = $(this).find('td:nth-child(1) a:nth-child(2)').text();
    torrent.seeders = $(this).find('td:nth-child(2)').text();
    torrent.leechers = $(this).find('td:nth-child(3)').text();
    torrent.url =  $(this).find('td:nth-child(1) a:nth-child(2)').attr('href');
    if (!torrent.url) {
      return;
    }
    torrent.url = leetxURL + torrent.url;
    if (torrent.name !== '') {
      torrents[index] = torrent
    }

    torrent.date = $(this).find('td:nth-child(4)').text();
    torrent.size = $(this).find('td:nth-child(5)').text();
    torrent.size = torrent.size.substr(0, torrent.size.indexOf("B") + 1);
  });
  return torrents;
}

async function getTorrentsImg(torrents) {
  await Promise.all(
    torrents.map(async (torrent, index) => {
      torrent.img = null;
      torrent.imdb = null;
      torrent.imdbid = null;
      torrent.rawMagnet = null;
      const responseTorrent = await request(torrent.url);
      const $descPage = cheerio.load(responseTorrent);
      torrent.imdbid = $descPage('#description').text().match(/(?<=https?\:\/\/www\.imdb\.com\/title\/)tt(.{7})/g);
      torrent.rawMagnet = $descPage('div.torrent-category-detail > ul.download-links-dontblock > li:nth-child(1) > a').attr('href');
      if (torrent.imdbid != null) {
        torrent.imdb = await imdb.get({id: torrent.imdbid[0]}, {apiKey: 'fea4440e'}).catch(e => console.error(e))
      }
      else {
        torrent.img = $descPage('#description img.descrimg').attr('data-original');
      }
    })
  );
  return torrents;
}

module.exports = {
  search: async function(query, page, sort) {
    let reqURL = `${leetxURL}/category-search/${query}/Movies/${page}/`;
    if (sort.type !== undefined)
      reqURL = `${leetxURL}/sort-category-search/${query}/Movies/${sort.type}/${sort.order}/${page}/`;
    try {
     const response = await request(reqURL);
     const $ = cheerio.load(response);

     let torrents = await loopThroughTorrent($);
     //torrents = await testTorrentsImg(torrents);
     torrents = await getTorrentsImg(torrents);
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
