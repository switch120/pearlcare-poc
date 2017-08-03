// Importing Node modules and initializing Express
const dotenv = require("dotenv");
dotenv.load();

const express = require('express'),
    https = require('https'),
    fs = require('fs'),
    app = express(),
    bodyParser = require('body-parser'),
    logger = require('morgan'),
    mongoose = require('mongoose'),
    config = require('./config/main'),
    router = require('./config/router');

var credentials = {
    key: fs.readFileSync(process.env.KEY),
    cert: fs.readFileSync(process.env.CERT)
};

// Setting up basic middleware for all Express requests
app.use(logger('dev')); // Log requests to API using morgan

// Enable CORS from client-side
app.use(config.cors);

// Database Connection
//mongoose.connect(config.database);

// JSON body-parser for urlencoded bodies
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Start the server
https.createServer(credentials, app).listen(process.env.PORT);

console.log('Your server is running on port ' + process.env.PORT + '.');

router(app);