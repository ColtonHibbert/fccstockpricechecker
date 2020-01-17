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

module.exports = async function (app) {

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
        console.log(symbol, 'symbol in getStockPrice')
        fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact&apikey=${process.env.ALPHA_VANTAGE_KEY}`).then(
          res => res.json()
        ).then(data => {
          //console.log(data)
          return data
        })
        
        
      }
      let stockDataResponse = {};

      if(stockSymbol1 && stockSymbol2 !== true ) {
        (async () => {
          const date = new Date();
          let month = (date.getMonth()) + 1;
          if(month < 10) {
            month = `0${month}`
          }
          const dayOfMonth = date.getDate();
          const year = date.getFullYear();
          const todaysDate = `${year}-${month}-${dayOfMonth}`
          const stock1 = await fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${stockSymbol1}&outputsize=compact&apikey=${process.env.ALPHA_VANTAGE_KEY}`).then(
            res => res.json()
          ).then(data => {
            //console.log(data)
            let stock = data['Time Series (Daily)'][todaysDate]['1. open']
            stock = Math.round(stock * 100) / 100;
            return stock
          })
          console.log(stock1)
          const stock1SymbolUpper = stockSymbol1.toUpperCase();
          stockDataResponse = {
            "stockData": {
              "stock": stock1SymbolUpper,
              "price": stock1
            }
          }
        })()
        return stockDataResponse;
      }

      if (stockSymbol1 && stockSymbol2) {
        (async () => {
          const date = new Date();
          let month = (date.getMonth()) + 1;
          if(month < 10) {
            month = `0${month}`
          }
          const dayOfMonth = date.getDate();
          const year = date.getFullYear();
          const todaysDate = `${year}-${month}-${dayOfMonth}`
          const stock1 = await fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${stockSymbol1}&outputsize=compact&apikey=${process.env.ALPHA_VANTAGE_KEY}`).then(
            res => res.json()
          ).then(data => {
            let stock = data['Time Series (Daily)'][todaysDate]['1. open']
            stock = Math.round(stock * 100) / 100;
            return stock
          })
          const stock2 = await fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${stockSymbol2}&outputsize=compact&apikey=${process.env.ALPHA_VANTAGE_KEY}`).then(
            res => res.json()
          ).then(data => {
            let stock = data['Time Series (Daily)'][todaysDate]['1. open']
            stock = Math.round(stock * 100) / 100;
            return stock
          })
          const stock1SymbolUpper = stockSymbol1.toUpperCase();
          const stock2SymbolUpper = stockSymbol2.toUpperCase();
          stockDataResponse = {
            "stockData": [
              { 
                "stock": stock1SymbolUpper,
                "price": stock1 
              },
              {
                "stock": stock2SymbolUpper,
                "price": stock2
              }
            ]
          }
      
        })()
      }
      
      
    });
    
};
