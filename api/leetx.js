// Modules
const request = require('request-promise')
const cheerio = require('cheerio')
const Xray = require('x-ray')

const xray = new Xray();


// 1337x.to base URL
let leetxURL = 'http://1337x.to'

async function loopThroughTorrent($) {
  let torrents = [];

  $('table.table-list tr').each(function(index, el){
    let torrent = {};
    torrent.name = $(this).find('td:nth-child(1) a:nth-child(2)').text();
    torrent.seeders = $(this).find('td:nth-child(2)').text();
    torrent.leechers = $(this).find('td:nth-child(3)').text();
    torrent.url =  $(this).find('td:nth-child(1) a:nth-child(2)').attr('href');
    if (!torrent.url) {
      return;
    }
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
      const responseTorrent = await request(leetxURL + torrent.url);
      const $descPage = cheerio.load(responseTorrent);
      torrents[index].imdb = $descPage('#description').text();
      torrents[index].imdb = torrents[index].imdb.substr(torrents[index].imdb.indexOf('http://www.imdb.com/title/tt'), 35);
      torrents[index].img = $descPage('#description img.descrimg').attr('data-original');
    })
  );
  return torrents;
}

async function testTorrentsImg(torrents) {
  for (const [index, torrent] of torrents.entries()) {
    const response = await xray(torrents[index].url, 'img .descrimg', [{
      imgURL : 'img@src'
    }])((err, res) => {
      console.log(res);
    })
  }
  return torrents;
}

module.exports = {
  search: async function(query, page) {
    console.log("begin");
    let reqURL = `${leetxURL}/category-search/${query}/Movies/${page}/`;

    try {
     const response = await request(reqURL);
     const $ = cheerio.load(response);

     let torrents = await loopThroughTorrent($);
     //test(torrents);
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
