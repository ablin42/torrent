// Load Modules
const express = require('express');
const request = require('request-promise');
const bodyParser = require('body-parser');
const YGG = require('yggtorrent');

// Set YGG client
var client = new YGG();
client.set_credential('harbinger42', '13031998');

// Set Engine
const router = express.Router();

// Body Parser Middleware
// Parse app/x-www-form-urlencoded
router.use(bodyParser.urlencoded({extended: false}));
// Parse app/json
router.use(bodyParser.json());

router.get('/', async (req, res) => {

  await client.search(function(result, page) {
      result.forEach((item, index) => {
        console.log(item , index)
        client.get_nfo(function(result) {
          console.log(result);
          //array
        }, item.id);
      })
      res.status(200).send(result);
  }, 'interstellar', '2139', '2148');
  
})


module.exports = router;
