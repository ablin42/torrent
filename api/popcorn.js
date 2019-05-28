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

///// POPCORN TIME API /////

// fetch torrents from popcorntime with /:query/:page/:type/:order
router.get('/search/:query/:page/:type/:order', async (req, res) => {
  const query = req.params.query;
  const page = req.params.page;
  const type = req.params.type;
  const order = req.params.order;

  const result = await popcornSearch(query, page, {type:type, order:order});
  res.status(200).send(result);
})

//fetch each page number available
router.get('/movies', async (req, res) => {
  const movies = await request('https://tv-v2.api-fetch.website/movies');
  res.status(200).send(movies);
})

//fetch a specific movie infos and its torrents using its ID
router.get('/movie/:imdbid', async (req, res) => {
  const imdbid = req.params.imdbid;
  let movie = await request(`https://tv-v2.api-fetch.website/movie/${imdbid}/`);

  if (!movie)
    res.status(200).send("There is no such movie with this imdb ID");

  res.status(200).send(movie);
})

//get a specific page from movies, page number has to be available in /movies
router.get('/movies/:page', async (req, res) => {
  const page = req.params.page;
  let maxPage = await request('https://tv-v2.api-fetch.website/movies');

  if (!maxPage.includes(`movies/${page}`)){
      maxPageNb = maxPage.substr((maxPage.length - 5), 3);
      res.status(200).send(`Invalid page number, please enter a page number between 1 and ${maxPageNb}`);
      return ;
  }

  const movies = await request(`https://tv-v2.api-fetch.website/movies/${page}`);
  const result = fetchUsefulData(JSON.parse(movies));
  res.status(200).send(result);
})

//fetch the top torrents
router.get('/top', async (req, res) => {
  result = await topTorrents();

  res.status(200).send(result);
})

//fetch a random movie infos and its torrents
router.get('/random', async (req, res) => {
  const movie = await request('https://tv-v2.api-fetch.website/random/movie');

  res.status(200).send(movie);
})

// fetch the data that will be needed to display properly the movie on the site
function fetchUsefulData(movies) {
  let result = [];
  for (i = 0; i < movies.length; i++) {
    let obj = {
      source: "popcorn",
      id: movies[i]._id,
      imdbid: movies[i].imdb_id,
      name: movies[i].title,
      seeders: 0,
      leechers: 0,
      size: 0,
      date: movies[i].released,
      year: parseInt(movies[i].year),
      runtime: parseInt(movies[i].runtime),
      genre: movies[i].genres,
      language: Object.keys(movies[i].torrents),
      img: movies[i].images.poster,
      rating: (movies[i].rating.percentage / 10)
    };

    for (language in movies[i].torrents) {
      for (quality in movies[i].torrents[language]) {
        if (movies[i].torrents[language][quality].seed + movies[i].torrents[language][quality].peer > obj.seeders + obj.leechers){
               obj.seeders = movies[i].torrents[language][quality].seed;
               obj.leechers = movies[i].torrents[language][quality].peer;
               obj.size = movies[i].torrents[language][quality].size;
          }
      }
    }
    result.push(obj);
  }
  return result;
}

//ask the popcorntime api a list of movies with query, page, and sort terms
//ignores sort terms if they aren't part of the allowed values
async function popcornSearch(query, page, sort) {
  const allowedType = ["title", "rating", "last added", "trending", "year"];
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

//fetch the top torrents from popcorntime, sorted by trending
async function topTorrents() {
  let url = `https://tv-v2.api-fetch.website/movies/1?genre=all&keywords=*&sort=trending&order=-1`;
  result = await request(url);

  return fetchUsefulData(JSON.parse(result));
}

module.exports = router;
