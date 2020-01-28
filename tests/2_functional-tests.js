/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/



var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');
const fetch = require('node-fetch');
const knex = require('knex');

const db = knex({
  client: 'pg',
  connection: {
    host: '127.0.0.1',
    user: process.env.LOCAL_USER,
    password: process.env.LOCAL_PASS,
    database: 'fcc_stock_price_checker'
  }
});



chai.use(chaiHttp);


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

suite('Functional Tests', function() {
    
    suite('GET /api/stock-prices => stockData object', function() {
      
      test('1 stock', function(done) {
       chai.request(server)
        .get('/api/stock-prices')
        .query({stock: 'goog'})
        .end( async function(err, res){
          const date = new Date();
          let month = (date.getMonth()) + 1;
          if(month < 10) {
            month = `0${month}`
          }
          const dayOfMonth = date.getDate();
          const year = date.getFullYear();
          const todaysDate = `${year}-${month}-${dayOfMonth}`
          
          
          const stock = await getStockPrice('GOOG', todaysDate);

          const likes = await getLikes(false, false, 'GOOG');

          console.log('this is the res body from sending res.json', res.body)
          //assert.deepEqual(res.body, {"stockData":{"stock":"GOOG","price":stock,"likes":likes}})
          //complete this one too
          
          done();
        });
      });
      
      test('1 stock with like', function(done) {
        
      });
      
      test('1 stock with like again (ensure likes arent double counted)', function(done) {
        
      });
      
      test('2 stocks', function(done) {
        
      });
      
      test('2 stocks with like', function(done) {
        
      });
      
    });

});
