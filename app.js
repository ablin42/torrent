// Load Modules
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

// Load Own Modules
const torrents = require('./api/torrents');
const leetx = require('./api/leetx');
const yts = require('./api/yts');
const popcorn = require('./api/popcorn');

// Set Engine
const app = express();

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

const port = process.env.PORT || 8089;
app.listen(port, () => console.log(`Listening on port ${port}...`));
