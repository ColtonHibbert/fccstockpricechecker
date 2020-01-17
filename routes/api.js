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
      console.log(process.env.ALPHA_VANTAGE_KEY)
      console.log('hi')
      console.log(req.query)
      let stockSymbol1;
      let stockSymbol2;
      if(req.query.stock[1]) {
        stockSymbol1 = req.query.stock[0];
        stockSymbol2 = req.query.stock[1];
      } 
      if(req.query.stock[0] !== true) {
        stockSymbol1 = req.query.stock
      }
      
      function getStockPrice(symbol) {
        fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact&apikey=${process.env.ALPHA_VANTAGE_KEY}`).then(
          res => res.json()
        ).then(data => {
          console.log(data)
          return data;
        })
      }
      const stockDataResponse = {};

      if(stockSymbol1) {
        stockData.stock = getStockPrice()
      }
      
      
    });
    
};
