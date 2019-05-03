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

<<<<<<< HEAD
async function processArray(torrents) {
  for (const [index, torrent] of torrents.entries()) {
    const responseTorrent = await request(leetxURL + torrent.url);
    const $descPage = cheerio.load(responseTorrent);
    torrents[index].img = $descPage('#description img.descrimg').attr('data-original');
  }
  return torrents;
  console.log('Done!');
=======
async function getTorrentsImg(torrents) {
  await Promise.all(
  torrents.map(async (torrent, index) => {
    const responseTorrent = await request(leetxURL + torrent.url);
    const $descPage = cheerio.load(responseTorrent);
    torrents[index].img = $descPage('#description img.descrimg').attr('data-original');
  })
  );
  return torrents;
>>>>>>> dbe28048fe35ec6b3d9b2cab647ffc9dadc0e346
}

module.exports = {
  search: async function(query, cb, category = null) {
<<<<<<< HEAD
    console.log("toto");
=======
    console.log("begin");
    console.time("time this");
>>>>>>> dbe28048fe35ec6b3d9b2cab647ffc9dadc0e346
    let reqURL = `${leetxURL}/category-search/${query}/Movies/1/`;

    try {
      const response = await request(reqURL);
      const $ = cheerio.load(response);
      
      let torrents = await loopThroughTorrent($);
<<<<<<< HEAD
      torrents = await processArray(torrents);
=======
      //test(torrents);
      torrents = await getTorrentsImg(torrents);
>>>>>>> dbe28048fe35ec6b3d9b2cab647ffc9dadc0e346
      console.log(torrents);
    } catch (error) {
      return Promise.reject(error);
    }
<<<<<<< HEAD

=======
   console.timeEnd("time this"); //4699ms
>>>>>>> dbe28048fe35ec6b3d9b2cab647ffc9dadc0e346
  }
}






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
