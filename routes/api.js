/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
const fetch = require('node-fetch');

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(function (req, res){
      console.log('hi')
      console.log(req.query)
      fetch('https://finance.google.com/finance/info?q=NASDAQ%3aGOOG').then(
        res => res.json()
      ).then(data => {
        console.log(data)
      })
      const stockData = {};
    });
    
};
