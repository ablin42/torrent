const PirateBay = require('thepiratebay');

class tpb {

  static async search() {//////////////
  const searchResults = await PirateBay.search('Game of Thrones', {
  category: 'all',    // default - 'all' | 'all', 'audio', 'video', 'xxx',
                      //                   'applications', 'games', 'other'
                      //
                      // You can also use the category number:
                      // `/search/0/99/{category_number}`
  filter: {
    verified: false    // default - false | Filter all VIP or trusted torrents
  },
  page: 0,            // default - 0 - 99
  orderBy: 'leeches', // default - name, date, size, seeds, leeches
  sortBy: 'desc'      // default - desc, asc
  })
  console.log(searchResults)
  }

  static async getTorrent(){//////////////
    PirateBay.getTorrent('10676856')
      .then(results => console.log(results))
      .catch(err => console.log(err))
  }

}

module.exports = tpb;
