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

///// YTS API /////

// fetch torrents  with /:query/:page/:type/:order
router.get('/search/:query/:page/:type/:order', async (req, res) => {
  const query = req.params.query;
  const page = req.params.page;
  const type = req.params.type;
  const order = req.params.order;

  const result = await ytsSearch(query, page, "", {type:type, order:order});
  res.status(200).send(result);
})

//fetch the top torrents
router.get('/top', async (req, res) => {
  result = await topTorrents();

  res.status(200).send(result);
})

//fetch a specific movie infos and its torrents using its ID
router.get('/movie/:id', async (req, res) => {
  const id = req.params.id;
  result = await searchMovie(id);

  res.status(200).send(result);
})

//suggest 4 movies similar to the movie with the ID being passed
router.get('/suggest/:id', async (req, res) => {
  const id = req.params.id;
  result = await suggestMovie(id);

  res.status(200).send(result);
})

// fetch the data that will be needed to display properly the movie on the site for one object and returns it
async function getTorrentsInfo(item, index) {
  let obj = {
    source: "yts",
    id: item.id.toString(),
    imdbid: item.imdb_code,
    name: item.title_english,
    seeders: item.torrents[0].seeds,
    leechers: item.torrents[0].peers,
    size: item.torrents[0].size_bytes,
    date: item.date_uploaded,
    year: item.year,
    runtime: item.runtime,
    genre: item.genres,
    language: item.language.toLowerCase().split(", ").map(i => i.substr(0, 2)),
    img: item.large_cover_image,
    rating: item.rating
  };

  if (obj.imdbid != null) {
    let options = {
      uri: `http://www.omdbapi.com/?apikey=fea4440e&i=${obj.imdbid}&plot=full`,
      json: true
    }
    imdbObj = await request(options);
    date = new Date(imdbObj.Released);
    timestamp = date.getTime();
    obj.date = timestamp;
  }

  if (!obj.img){
    obj.img = item.medium_cover_image;
  }

  if (item.torrents) {
    item.torrents.forEach((torrent, tindex) => {
      if (torrent.seeds + torrent.peers > obj.seeders + obj.leechers){
          obj.seeders = item.torrents[tindex].seeds;
          obj.leechers = item.torrents[tindex].peers;
          obj.size = item.torrents[tindex].size_bytes;
        }
      })
  }
  obj.api_url = `api/yts/movie/${obj.id}`;

  return obj;
}

// calls the function to fetch the data for each movie and push it in an array
async function fetchUsefulData(movies) {
  let result = [];

  if (movies.data.movies) {
    for (i = 0; i < movies.data.movies.length; i++){
      obj = await getTorrentsInfo(movies.data.movies[i], i);
      result.push(obj);
    }
  }

  return result;
}

//ask the yts api a list of movies with query, page, genre, and sort terms
//ignores sort terms if they aren't part of the allowed values
async function ytsSearch(query, page, sort) {
  let url = `https://yts.am/api/v2/list_movies.json?query_term=${query}&page=${page}`;
  const limit = 50;
  const allowedType = ["title", "year", "rating", "peers", "seeds", "download_count", "like_count", "date_added"];
  const allowedOrder = ["asc", "desc"];

  if (sort.type === "name")
    sort.type = "title";
  if (sort.type === "leechers")
    sort.type = "peers";
  if (sort.type === "seeders")
    sort.type = "seeds";

  if (sort) {
    if (allowedType.includes(sort.type) && allowedOrder.includes(sort.order))
      url += `&sort_by=${sort.type}&order_by=${sort.order}`;
  }
  console.log(url)
  movies = await request(url);

  return fetchUsefulData(JSON.parse(movies));
}

//fetch a specific movie infos and its torrents using its ID
async function searchMovie(id) {
  if (id <= 0)
    return "Please enter a valid ID";
  let url = `https://yts.am/api/v2/movie_details.json?movie_id=${id}&with_images=true&with_cast=true`;
  console.log(url);
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
    language: parsed.data.movie.language.toLowerCase().split(", ").map(i => i.substr(0, 2)),
    img: parsed.data.movie.large_cover_image,
    rating: parsed.data.movie.rating,
    torrents: parsed.data.movie.torrents,
    description: parsed.data.movie.description_full,
  };

  if (obj.imdbid != null) {
    let options = {
      uri: `http://www.omdbapi.com/?apikey=fea4440e&i=${obj.imdbid}&plot=full`,
      json: true
    }
    imdbObj = await request(options);
    date = new Date(imdbObj.Released);
    timestamp = date.getTime();
    obj.date = timestamp;
  }

  if (obj.imdbid != null) {
    imdbObj = await imdb.get({id: obj.imdbid}, {apiKey: 'fea4440e'}).catch(e => console.error(e))
    obj.actors = imdbObj.actors.split(", ");
    obj.directors = imdbObj.director.split(", ");
  }

  if (obj.id === 0)
    return "There is no movie with this ID";
    
  if (obj.torrents) {
    obj.torrents.forEach((item, index) => {
      item.magnet = constructMagnet(item.hash, obj.slug);
    })
  }

  return obj;
}

//fetch the top torrents from popcorntime, sorted by download_count
async function topTorrents() {
  let url = "https://yts.am/api/v2/list_movies.json?limit=50&page=1&sort_by=download_count&order_by=desc";
  result = await request(url);

  return fetchUsefulData(JSON.parse(result));
}

//suggest 4 movies similar to the movie with the ID being passed, returns infos to display them
async function suggestMovie(id) {
  movieInfo = await searchMovie(id);
  if (typeof movieInfo !== 'object') {
    return movieInfo;
  }
  let url = `https://yts.am/api/v2/movie_suggestions.json?movie_id=${id}`;
  result = await request(url);

  return fetchUsefulData(JSON.parse(result));
}

//construct the yts magnet using torrent hash and movie name
function constructMagnet(torrent_hash, movie_name) {
  return `magnet:?xt=urn:btih:${torrent_hash}&dn=${movie_name}&tr=udp://tracker.opentrackr.org:1337/announce&tr=udp://glotorrents.pw:6969/announce`;
}

module.exports = router;
