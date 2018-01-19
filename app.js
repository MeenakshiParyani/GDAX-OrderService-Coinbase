var express = require('express');
var bodyParser = require('body-parser');

var quoteAPI = require('./api/quote.js');


// Express
var app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use('/api/quote', quoteAPI);

// Start Server
app.listen(3000);
console.log('API running on port 3000');
