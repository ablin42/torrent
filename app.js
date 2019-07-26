// Load Modules
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const request = require('request-promise');

// Load Own Modules
const torrents = require('./api/torrents');
const leetx = require('./api/leetx');
const yts = require('./api/yts');
const popcorn = require('./api/popcorn');

// Set Engine
const app = express();

// Set the view engine
app.set('view engine', 'ejs');

// Body Parser Middleware
// Parse app/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}));
// Parse app/json
app.use(bodyParser.json());

// Define routers
app.use('/api/torrents', torrents);
app.use('/api/leetx', leetx);
app.use('/api/yts', yts);
app.use('/api/popcorn', popcorn);

app.get('/', async (req, res) => {
    top = await request('http://localhost:8089/api/torrents/top');
    res.render('home', {
            top: top
    })
    res.status(200);
})

app.post('/search', async (req, res) => {
    const query = req.body.query,
    page  = req.body.page,
    type  = req.body.type,
    order = req.body.order;
    movies = await request(`http://localhost:8089/api/torrents/search/${query}/${page}/${type}/${order}`);

  
    res.status(200).render('searchresult', {
        movies: movies
    });
})

const port = process.env.PORT || 8089;
app.listen(port, () => console.log(`Listening on port ${port}...`));
