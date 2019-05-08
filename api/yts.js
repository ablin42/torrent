// Load Modules
const express = require('express');
const request = require('request-promise');
const bodyParser = require('body-parser');

// Set Engine
const router = express.Router();

// Body Parser Middleware
// Parse app/x-www-form-urlencoded
router.use(bodyParser.urlencoded({extended: false}));
// Parse app/json
router.use(bodyParser.json());


router.get('/search/:query/:page/:type/:order', async (req, res) => {
  const query = req.params.query;
  const page = req.params.page;
  const type = req.params.type;
  const order = req.params.order;

  const result = await searchYts(query, page, "", {type:type, order:order});
  res.status(200).send(result);
})

// router.get('/search/:query/:page/:type/:order/:genre', async (req, res) => {
//   const query = req.params.query;
//   const page = req.params.page;
//   const type = req.params.type;
//   const order = req.params.order;
//   const genre = req.params.genre;
//
//   const result = await searchYts(query, page, genre, {type:type, order:order});
//   res.status(200).send(result);
// })

function fetchUsefulData(movies) {
  let result = [];
  if (movies.data.movies) {
    movies.data.movies.forEach((item, index) => {
      let obj = {
        id: item.id,
        imdbid: item.imdb_code,
        name: item.title_english,
        seeders: item.torrents[0].seeds,
        leechers: item.torrents[0].peers,
        date: item.date_uploaded,
        size: item.torrents[0].size,
        year: item.year,
        runtime: item.runtime,
        genre: item.genres,
        language: item.language,
        img: item.large_cover_image,
        rating: item.rating
      };
      result.push(obj);
    })
  }
  return result;
}

async function searchYts(query, page, genre, sort) {
  const limit = 50;
  const allowedGenre = ["Action", "Adventure","Animation","Biography","Comedy","Crime","Documentary","Drama","Family","Fantasy"
                        ,"Film Noir","History","Horror","Music","Musical","Mystery","Romance","Sci-Fi","Short","Sport",
                        "Superhero","Thriller","War","Western"];
  const allowedType = ["title", "year", "rating", "peers", "seeds", "download_count", "like_count", "date_added"];
  const allowedOrder = ["asc", "desc"];

  if (sort.type === "name")
    sort.type = "title";
  if (sort.type === "leechers")
    sort.type = "peers";
  if (sort.type === "seeders")
    sort.type = "seeds";

  let url = `https://yts.am/api/v2/list_movies.json?query_term=${query}&page=${page}`;
  if (allowedGenre.includes(genre))
    url += `&genre=${genre}`;

  if (sort) {
    if (allowedType.includes(sort.type) && allowedOrder.includes(sort.order))
      url += `&sort_by=${sort.type}&order_by=${sort.order}`;
  }

  movies = await request(url);
  result = fetchUsefulData(JSON.parse(movies));
  return result;
}

module.exports = router;
