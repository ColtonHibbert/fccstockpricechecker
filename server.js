'use strict';

var express     = require('express');
var bodyParser  = require('body-parser');
var expect      = require('chai').expect;
var cors        = require('cors');
const helmet = require('helmet');


var apiRoutes         = require('./routes/api.js');
var fccTestingRoutes  = require('./routes/fcctesting.js');
var runner            = require('./test-runner');

var app = express();
require('dotenv').config()
app.use('/public', express.static(process.cwd() + '/public'));

app.use(cors({origin: '*'})); //For FCC testing purposes only

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// causing errors
//"'unsafe-inline'"
// app.use(helmet.contentSecurityPolicy({
//   directives: {
//     scriptSrc: ['https://coltfccstockpricechecker.herokuapp.com/', 'https://code.jquery.com/jquery-2.2.1.min.js'],
//     styleSrc: ['https://coltfccstockpricechecker.herokuapp.com/']
//   }
// }))

const knex = require('knex');

// const db = knex({
//   client: 'pg',
//   connection: {
//     host: '127.0.0.1',
//     user: process.env.LOCAL_USER,
//     password: process.env.LOCAL_PASS,
//     database: 'fcc_stock_price_checker'
//   }
// });

const db = knex({
  client: 'pg',
  connection: {
    connectionString: process.env.DATABASE_URL,
    ssl: true
  }
})

//Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  });

//For FCC testing purposes
fccTestingRoutes(app);

//Routing for API 
// db injection
apiRoutes(app, db);  
    
//404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

//Start our server and tests!
app.listen(process.env.PORT || 3000, function () {
  process.env.NODE_ENV="test";
  console.log("Listening on port 3000 or " + process.env.PORT);
  if(process.env.NODE_ENV==='test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch(e) {
        var error = e;
          console.log('Tests are not valid:');
          console.log(error);
      }
    }, 3500);
  }
});


module.exports = app; //for testing
