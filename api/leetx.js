// Modules
const request = require('request-promise');
const cheerio = require('cheerio');


// 1337x.to base URL
const leetxURL = 'http://1337x.to';

function loopThroughTorrent($) {
  const torrents = [];
  const torrent = {};

  // eslint-disable-next-line func-names
  $('table.table-list tr').each(function () {
    torrent.name = $(this).find('td:nth-child(1) a:nth-child(2)').text();
    torrent.seeders = $(this).find('td:nth-child(2)').text();
    torrent.leechers = $(this).find('td:nth-child(3)').text();
    torrent.url = $(this).find('td:nth-child(1) a:nth-child(2)').attr('href');
    if (!torrent.url) {
      return;
    }
    if (torrent.name !== '') {
      torrents.push(torrent);
    }
    torrent.date = $(this).find('td:nth-child(4)').text();
    torrent.size = $(this).find('td:nth-child(5)').text();
    torrent.size = $(this).find('td:nth-child(5)').text();
  });
  return torrents;
}

async function getTorrentsImg(torrents) {
  await Promise.all(
    torrents.map(async (torrent, index) => {
      const responseTorrent = await request(leetxURL + torrent.url);
      const $descPage = cheerio.load(responseTorrent);
      torrents[index].img = $descPage('#description img.descrimg').attr('data-original');
    }),
  );
  return torrents;
}

module.exports = {
  // eslint-disable-next-line no-unused-vars
  async search(query, cb, category = null) {
    const reqURL = `${leetxURL}/category-search/${query}/Movies/1/`;
    let torrents;
    try {
      const response = await request(reqURL);
      const $ = cheerio.load(response);

      torrents = loopThroughTorrent($);
      torrents = await getTorrentsImg(torrents);
    } catch (error) {
      return Promise.reject(error);
    }
    return torrents;
  },
};


// // Modules
// const request = require('request-promise')
// const cheerio = require('cheerio')


// // 1337x.to base URL
// let leetxURL = 'http://1337x.to'

// module.exports = {
//   search:async function(query, cb, category = null) {
//     let torrents = []
//     var reqURL = `${leetxURL}/category-search/${query}/Movies/1/`
//     await request(reqURL).then(body => {
//       var $ = cheerio.load(body)
// var torrent = {}
//   var arr = []
//       $('table.table-list tr').each(async function(index, el) {

//         torrent.name = $(this).find('td:nth-child(1) a:nth-child(2)').text()
//         torrent.seeders = $(this).find('td:nth-child(2)').text()
//         torrent.leechers = $(this).find('td:nth-child(3)').text()
//         torrent.url =  $(this).find('td:nth-child(1) a:nth-child(2)').attr('href')
//         if (!torrent.url)
//           return ;
//         if (torrent.name !== '')
//           torrents.push(torrent)

//         torrent.date = $(this).find('td:nth-child(4)').text();
//         torrent.size = $(this).find('td:nth-child(5)').text();
//         torrent.size = torrent.size.substr(0, torrent.size.indexOf("B") + 1);

//          await request(leetxURL + torrent.url).then(body => {
//               var $descPage = cheerio.load(body);
//               torrent.img = $descPage('#description img.descrimg').attr('data-original');
//             }).catch(e => console.error(e))

//             return (torrent);
//         //  console.log(torrent);//console.log here show img url
//         //  console.log(torrent.img)
//       }).then(t => console.log(t)).catch(e => console.error(e));
//         console.log(torrent)
//       console.log(torrents[0].img, torrents[1].img); // here img url missing

//     })
//     console.log(torrents[0].img, torrents[1].img, torrents[0].size);
//     return torrents
//   }
// }
