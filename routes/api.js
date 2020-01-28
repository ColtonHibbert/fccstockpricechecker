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
      const ipAddress = req.connection.remoteAddress;
      console.log(ipAddress, 'ip address')
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
      
      async function getStockPrice(symbol, todaysDate) {
        let stock = null;
        await fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact&apikey=${process.env.ALPHA_VANTAGE_KEY}`).then(
          res => res.json()
        ).then(data => {
          stock = data['Time Series (Daily)'][todaysDate]['1. open']
          stock = Math.round(stock * 100) / 100;
        })
        return String(stock)
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

      async function getLikes(like, checkIp, stockSymbolUpper) {
          let likes = null;
  
          if(like && checkIp === false) {
            console.log('like was true and checkip false')
            await db.transaction(trx => {
              trx('company').where('ticker', '=', stockSymbolUpper).increment('likes', 1)
              .returning('likes')
              .then(likeData => { 
                console.log('likes',likeData)
                likes = likeData;
              })
              .then(trx.commit)
              .catch(trx.rollback)
            })
            .catch(err => console.log(err))
            return likes;
          }

          // error from line below
          await db.select('likes').from('company').where('ticker', '=', stockSymbolUpper)
          .then(data => {
            console.log(data, 'likes should be here')
            likes = data[0].likes
          })
          .catch(err => console.log(err))
          return likes;  
      }

      async function getIp() {
        let ipExists = false;
        await db.select('ip').from('ip').where('ip', '=', ipAddress)
        .then(data => {
          console.log(data, 'ip address data in get ip')
          if(data[0]) {
            ipExists = true;
          }
        })
        .catch(err => console.log(err))
        console.log(ipExists)
        return ipExists;
      }

      async function insertIp(ipAddress) {
        db.transaction(trx => {
          trx.insert({ip: ipAddress}).into('ip')
          .then(trx.commit)
          .catch(trx.rollback)
        })
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
          
          const stock1SymbolUpper = stockSymbol1.toUpperCase();

          const checkIp = await getIp(ipAddress);
          console.log(checkIp, 'checkIp')

          if(checkIp === false) {
            insertIp(ipAddress)
          } 

          const stock1 = await getStockPrice(stock1SymbolUpper, todaysDate );
          console.log(stock1, 'stock1')

          const tickerInDB = await checkTickerSymbol(stock1SymbolUpper);
          console.log(tickerInDB, 'tickerInDB');
          
          const tickerInserted = await insertTicker(tickerInDB, stock1SymbolUpper);
          console.log(tickerInserted, 'tickerInserted');
           
          const likes = await getLikes(like, checkIp, stock1SymbolUpper );
          console.log(likes , 'likes');
          

          stockDataResponse = {
            "stockData": {
              "stock": stock1SymbolUpper,
              "price": stock1,
              "likes": likes
            }
          }
          console.log(stockDataResponse)
          res.json(stockDataResponse);
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
          const todaysDate = `${year}-${month}-${dayOfMonth}`;
          const stock1SymbolUpper = stockSymbol1.toUpperCase();
          const stock2SymbolUpper = stockSymbol2.toUpperCase();

          const checkIp = await getIp(ipAddress);
          console.log(checkIp, 'checkIp')

          if(checkIp === false) {
            insertIp(ipAddress)
          } 

          const stock1 = await getStockPrice(stock1SymbolUpper, todaysDate);
          
          const stock2 = await getStockPrice(stock2SymbolUpper, todaysDate);
         
          const ticker1InDB = await checkTickerSymbol(stock1SymbolUpper);
          
          const ticker2InDB = await checkTickerSymbol(stock2SymbolUpper);
          
          const ticker1Inserted = await insertTicker(ticker1InDB, stock1SymbolUpper);

          const ticker2Inserted = await insertTicker(ticker2InDB, stock2SymbolUpper);

          const likes1 = await getLikes(like, checkIp, stock1SymbolUpper);

          const likes2 = await getLikes(like, checkIp, stock2SymbolUpper);

          const relLikes1 = likes1 - likes2;

          const relLikes2 = likes2 - likes1;


          stockDataResponse = {
            "stockData": [
              { 
                "stock": stock1SymbolUpper,
                "price": stock1,
                "rel_likes": relLikes1
              },
              {
                "stock": stock2SymbolUpper,
                "price": stock2,
                "rel_likes": relLikes2
              }
            ]
          }
          console.log(stockDataResponse);
          res.json(stockDataResponse);
        })()
      }
      

    });
    
};
