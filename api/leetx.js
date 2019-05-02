// Modules
const request = require('request-promise')
const cheerio = require('cheerio')


// 1337x.to base URL
let leetxURL = 'http://1337x.to'

async function loopThroughTorrent($) {
  let torrents = [];
  const torrent = {};

  $('table.table-list tr').each(function(index, el){
    torrent.name = $(this).find('td:nth-child(1) a:nth-child(2)').text();
    torrent.seeders = $(this).find('td:nth-child(2)').text();
    torrent.leechers = $(this).find('td:nth-child(3)').text();
    torrent.url =  $(this).find('td:nth-child(1) a:nth-child(2)').attr('href');
    if (!torrent.url) {
      return;
    }
    if (torrent.name !== '') {
      torrents.push(torrent)
    }
    torrent.date = $(this).find('td:nth-child(4)').text();
    torrent.size = $(this).find('td:nth-child(5)').text();
    torrent.size = $(this).find('td:nth-child(5)').text();
  });

  return torrents;
}

async function processArray(torrents) {
  for (const [index, torrent] of torrents.entries()) {
    const responseTorrent = await request(leetxURL + torrent.url);
    const $descPage = cheerio.load(responseTorrent);
    torrents[index].img = $descPage('#description img.descrimg').attr('data-original');
  }
  return torrents;
  console.log('Done!');
}

module.exports = {
  search: async function(query, cb, category = null) {
    console.log("toto");
    let reqURL = `${leetxURL}/category-search/${query}/Movies/1/`;

    try {
      const response = await request(reqURL);
      const $ = cheerio.load(response);
      
      let torrents = await loopThroughTorrent($);
      torrents = await processArray(torrents);
      console.log(torrents);
    } catch (error) {
      return Promise.reject(error);
    }

  }
}
