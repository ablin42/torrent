// Load Modules
const express = require('express');
const request = require('request-promise');
const bodyParser = require('body-parser');
const imdb = require('imdb-api');

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

  const result = await popcornSearch(query, page, {type:type, order:order});
  res.status(200).send(result);
})

router.get('/movies', async (req, res) => {
  const movies = await request('https://tv-v2.api-fetch.website/movies');
  res.status(200).send(movies);
})

router.get('/movies/:page', async (req, res) => {
  const page = req.params.page;
  let maxPage = await request('https://tv-v2.api-fetch.website/movies');

  if (!maxPage.includes(`movies/${page}`)){
      maxPageNb = maxPage.substr((maxPage.length - 5), 3);
      res.status(200).send(`Invalid page number, please enter a page number between 1 and ${maxPageNb}`);
      return ;
  }

  const movies = await request(`https://tv-v2.api-fetch.website/movies/${page}`);
  res.status(200).send(movies);
})

router.get('/top', async (req, res) => {
  result = await topTorrents();

  res.status(200).send(result);
})

router.get('/movie/:imdbid', async (req, res) => {
  const imdbid = req.params.imdbid;
  let movie = await request(`https://tv-v2.api-fetch.website/movie/${imdbid}/`);

  if (!movie)
    movie = "There is no such movie with this imdb ID";
  res.status(200).send(movie);
})

router.get('/random', async (req, res) => {
  const movies = await request('https://tv-v2.api-fetch.website/random/movie');
  res.status(200).send(movies);
})

function fetchUsefulData(movies) {
  let result = [];
  if (movies) {
    movies.forEach((item, index) => {
      let obj = {
        source: "popcorn",
        id: item._id,
        imdbid: item.imdb_id,
        name: item.title,
        seeders: 0,
        leechers: 0,
        size: 0,
        date: item.released,
        year: parseInt(item.year),
        runtime: parseInt(item.runtime),
        genre: item.genres,
        language: Object.keys(item.torrents),
        img: item.images.poster,
        rating: (item.rating.percentage / 10)
      };

      for (language in item.torrents) {
        for (quality in item.torrents[language]) {
          if (item.torrents[language][quality].seed + item.torrents[language][quality].peer > obj.seeders + obj.leechers){
                 obj.seeders = item.torrents[language][quality].seed;
                 obj.leechers = item.torrents[language][quality].peer;
                 obj.size = item.torrents[language][quality].size;
            }
        }
      }
      result.push(obj);
    })
  }
  return result;
}

async function popcornSearch(query, page, sort) {
  const allowedType = ["name", "rating", "released", "trending", "updated", "year"];
  const allowedOrder = ["asc", "desc"];

  let order = 1;
  if (sort.order === "desc")
    order = -1;
  let url = `https://tv-v2.api-fetch.website/movies/${page}?genre=all&keywords=${query}`;

  if (sort) {
    if (allowedType.includes(sort.type) && allowedOrder.includes(sort.order))
      url += `&sort=${sort.type}&order=${order}`;
  }

  console.log(url)
  movies = await request(url);
  return fetchUsefulData(JSON.parse(movies));
}

async function topTorrents() {
  
}

module.exports = router;
