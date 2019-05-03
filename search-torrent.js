const torrents = require('./api/torrents');
const leetx = require('./api/leetx')
const PirateBay = require('thepiratebay');

module.exports = {
  searchTorrent: async function(query, page) {
  let leetxTorrents = await leetx.search(query, page + 1),
      tpbTorrents   = await PirateBay.search(query, {
                      category: 'video', // You can also use the category number: `/search/0/99/{category_number}`
                      filter: {
                        verified: false    // default - false | Filter all VIP or trusted torrents
                      },
                      page: page,            // default - 0 - 99
                      orderBy: 'name', // default - name, date, size, seeds, leeches
                      sortBy: 'asc'      // default - desc, asc
                      });
                      console.log(tpbTorrents);
                      }
                    }
