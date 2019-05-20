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

  const result = await ytsSearch(query, page, "", {type:type, order:order});
  res.status(200).send(result);
})

router.get('/search/:query/:page/:type/:order/:genre', async (req, res) => {
  const query = req.params.query;
  const page = req.params.page;
  const type = req.params.type;
  const order = req.params.order;
  const genre = req.params.genre;

  const result = await ytsSearch(query, page, genre, {type:type, order:order});
  res.status(200).send(result);
})

router.get('/top', async (req, res) => {
  result = await topTorrents();

  res.status(200).send(result);
})

router.get('/movie/:id', async (req, res) => {
  const id = req.params.id;
  result = await searchMovie(id);

  res.status(200).send(result);
})

router.get('/suggest/:id', async (req, res) => {
  const id = req.params.id;
  result = await suggestMovie(id);

  res.status(200).send(result);
})

function fetchUsefulData(movies) {
  let result = [];
  if (movies.data.movies) {
    movies.data.movies.forEach((item, index) => {
      let obj = {
        source: "yts",
        id: item.id,
        imdbid: item.imdb_code,
        name: item.title_english,
        seeders: item.torrents[0].seeds,
        leechers: item.torrents[0].peers,
        size: item.torrents[0].size,
        date: item.date_uploaded,
        year: item.year,
        runtime: item.runtime,
        genre: item.genres,
        language: item.language,
        img: item.large_cover_image,
        rating: item.rating
      };
      if (!obj.img){
        obj.img = item.medium_cover_image;
      }
      if (item.torrents) {
        item.torrents.forEach((torrent, tindex) => {
          if (torrent.seeds + torrent.peers > obj.seeders + obj.leechers){
              obj.seeders= item.torrents[tindex].seeds;
              obj.leechers= item.torrents[tindex].peers;
              obj.size= item.torrents[tindex].size;
            }
          })
      result.push(obj);
      }
    })
  }
  return result;
}

async function ytsSearch(query, page, genre, sort) {
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
  return fetchUsefulData(JSON.parse(movies));
}

async function searchMovie(id) {
  if (id <= 0)
    return "Please enter a valid ID";
  let url = `https://yts.am/api/v2/movie_details.json?movie_id=${id}&with_images=true&with_cast=true`;
  result = await request(url);
  parsed = JSON.parse(result);

  let obj = {
    source: "yts",
    id: parsed.data.movie.id,
    imdbid: parsed.data.movie.imdb_code,
    name: parsed.data.movie.title_english,
    slug: parsed.data.movie.slug,
    date: parsed.data.movie.date_uploaded,
    year: parsed.data.movie.year,
    runtime: parsed.data.movie.runtime,
    genre: parsed.data.movie.genres,
    language: parsed.data.movie.language,
    img: parsed.data.movie.large_cover_image,
    rating: parsed.data.movie.rating,
    torrents: parsed.data.movie.torrents,
    description: parsed.data.movie.description_full,
  };
  if (obj.id === 0)
    return "There is no movie with this ID";
  if (obj.torrents) {
    obj.torrents.forEach((item, index) => {
      item.magnet = constructMagnet(item.hash, obj.slug);
    })
  }
  return obj;
}

async function topTorrents() {
  let url = "https://yts.am/api/v2/list_movies.json?limit=50&page=1&sort_by=download_count&order_by=desc";
  result = await request(url);

  return fetchUsefulData(JSON.parse(result));
}

async function suggestMovie(id) {
  movieInfo = await searchMovie(id);
  if (typeof movieInfo !== 'object') {
    return movieInfo;
  }
  let url = `https://yts.am/api/v2/movie_suggestions.json?movie_id=${id}`;
  result = await request(url);

  return fetchUsefulData(JSON.parse(result));
}

function constructMagnet(torrent_hash, movie_name) {
  return `magnet:?xt=urn:btih:${torrent_hash}&dn=${movie_name}&tr=udp://tracker.opentrackr.org:1337/announce&tr=udp://glotorrents.pw:6969/announce`;
}

module.exports = router;
