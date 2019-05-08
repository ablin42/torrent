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


module.exports = router;
