// Modules
const request = require('request-promise')
const cheerio = require('cheerio')


// 1337x.to base URL
let leetxURL = 'http://1337x.to'

module.exports = {
  search: function(query, cb, category = null) {
    let torrents = []
    var reqURL = `${leetxURL}/category-search/${query}/Movies/1/`
    request(reqURL).then(body => {
      var $ = cheerio.load(body)
      $('table.table-list tr').each(async function() {
        let torrent = {
          "img": "",
          "name" : ""

        }
        torrent.name = $(this).find('td:nth-child(1) a:nth-child(2)').text()
        torrent.seeders = $(this).find('td:nth-child(2)').text()
        torrent.leechers = $(this).find('td:nth-child(3)').text()
        torrent.url =  $(this).find('td:nth-child(1) a:nth-child(2)').attr('href')
        if (!torrent.url)
          return ;
        if (torrent.name !== '')
          torrents.push(torrent)

        torrent.date = $(this).find('td:nth-child(4)').text();
        torrent.size = $(this).find('td:nth-child(5)').text();
        torrent.size = torrent.size.substr(0, torrent.size.indexOf("B") + 1);

        await request(leetxURL + torrent.url).then(body => {
            var $x = cheerio.load(body);
            torrent.img = $x('#description img.descrimg').attr('data-original');
            return torrent.img;
          }).catch(e => console.error(e))
        torrent.img = torrent.img;
        //console.log(torrent.img);
      })
  //console.log(torrents[0].img);
      return cb(null, torrents)
    })
  }
}
