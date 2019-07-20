// Load Modules
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const {check, validationResult} = require('express-validator')

//connect to db
mongoose.connect('mongodb://localhost/node-demo', {useNewUrlParser: true});//change this

//schema
var commentSchema = new mongoose.Schema({
    content: {type: String, required: true},
    createdAt: {type: String, required: true},
    creator: {type: String, required: true},//User use user id
}, {versionKey: false})

//create model from schema
var Comment = mongoose.model("Comment", commentSchema);

// Set Engine
const app = express();

//routes to js functions
app.use("/js", express.static(__dirname + "/js"))

// Body Parser Middleware
// Parse app/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}));
// Parse app/json
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
})

app.post("/addcomment", [
  //check('creator').isUser(),
  check('content').isLength({min: 4, max: 256})
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({errors: errors.array()});

  let data = new Comment(req.body);
  data.createdAt = Date.now();
  data.save()
  .then(item => {
    res.send("Comment added");
  })
  .catch(err => {
    res.status(400).send("An error occured, please try again");
  })
})

const port = process.env.PORT || 8089;
app.listen(port, () => console.log(`Listening on port ${port}...`));
