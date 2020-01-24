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

module.exports = async function (app, db) {

   app.route('/api/stock-prices')
    .get(function (req, res){
      console.log(req.query)
      let stockSymbol1;
      let stockSymbol2;
      let like = req.query.like;
      if( typeof req.query.stock === "object" ) {
        stockSymbol1 = req.query.stock[0];
        stockSymbol2 = req.query.stock[1];
      } 
      if( typeof req.query.stock === "string" ) {
        stockSymbol1 = req.query.stock
      }
      if(like) {
        like = true;
      }
      console.log('stocksymbol1', stockSymbol1)
      console.log('stocksymbol2', stockSymbol2)
      console.log('like', like)
      
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

      async function checkTickerSymbol(symbol) {
        let ticker = null; 
        await db.select('ticker').from('company').where('ticker', '=', symbol)
        .then(data => ticker = data)
        .catch(err => console.log(err))
        console.log(ticker);
        if (ticker[0]) {
          return true;
        }
        return false;
      }

      async function insertTicker(tickerInDB, stockSymbolUpper ) {
          if(tickerInDB === false) {
            await db.transaction(trx => {
              trx.insert({ ticker: stockSymbolUpper}).into('company')
              .then(trx.commit)
              .catch(trx.rollback)
            })
            .catch(err => console.log(err))
            return true
          } 
          return false;
      }

      async function incrementLike(like, stockSymbolUpper) {
        if(like) {
            await db.transaction(trx => {
              trx('company').where('ticker', '=', stockSymbolUpper).increment('likes', 1)
              .returning('likes')
              .then(likes => console.log('likes',likes) )
              .then(trx.commit)
              .catch(trx.rollback)
            })
            .catch(err => console.log(err))
            return true;
          }
          return false;
      }

      if(stockSymbol1 && stockSymbol2 !== true ) {
        console.log('1 ran');
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
          //console.log(stock1)
          const stock1SymbolUpper = stockSymbol1.toUpperCase();

          const tickerInDB = await checkTickerSymbol(stock1SymbolUpper);
          console.log(tickerInDB, 'tickerInDB');
          
          const tickerInserted = await insertTicker(tickerInDB, stock1SymbolUpper);
          console.log(tickerInserted, 'tickerInserted');
           
          const likeIncremented = await incrementLike(like, stock1SymbolUpper );
          console.log(likeIncremented , 'likeIncremented');
          

          stockDataResponse = {
            "stockData": {
              "stock": stock1SymbolUpper,
              "price": stock1
            }
          }
          console.log(stockDataResponse)
          return stockDataResponse;
        })()
      }

      if (stockSymbol1 && stockSymbol2) {
        console.log('2 true');
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
          console.log(stockDataResponse);
          return stockDataResponse;
        })()
      }
      
    });
    
};
