var express = require('express');
var router = express.Router();
var orderbookService = require('../service/order-book-service.js');
var bids = [];
var asks = [];
let currencyReversed;

router.post('/', function(req,res){
  currencyReversed = false;
  // Take the API input
  console.log(req.body);
  var action        = req.body.action;
  var baseCurrency  = req.body.base_currency;
  var quoteCurrency = req.body.quote_currency;
  var amount        = req.body.amount;

  // See if the trade is possible
  isTradePossible(baseCurrency, quoteCurrency).then(function(status){
      // If Orderbook is present

      if(status){
          console.log('Currency Reversed' + currencyReversed);
          switch(action){
            //** for ex - buying USD equivalent to selling BTC as orderbook has BTC values only(only for one currency at a time)
             case 'buy'  : currencyReversed ? sellCurrency(bids, amount, quoteCurrency, res) : buyCurrency(asks, amount, quoteCurrency, res);
                           break;
             case 'sell' : currencyReversed ? sellCurrency(bids, amount, quoteCurrency, res) : buyCurrency(asks, amount, quoteCurrency, res);
                           break;
             default     : res.status(401).send({"error" : "Invalid action, Please choose from buy/sell!!"});
          }
      }else{//If Orderbook is not present
        res.json({"error" : "Given Currencies can not be traded!!"});
      }
  });

});

function buyCurrency(asks, amount, quoteCurrency, res){
    console.log('Buying in ' + quoteCurrency);
    getQuotesFromAsks(asks, amount, quoteCurrency)
    .then(function(response){
       res.json(response);
    })
    .catch(function(err){
       res.json(err);
    });
}

function sellCurrency(bids, amount, quoteCurrency, res){
    console.log('Selling in ' + quoteCurrency);
    getQuotesFromBids(bids, amount, quoteCurrency)
    .then(function(response){
       res.json(response);
    })
    .catch(function(err){
       res.json(err);
    });
}

function getQuotesFromBids(bids, amount, quoteCurrency){
  return new Promise(function(resolve, reject) {
      if(bids && bids.length){
        var updatedAmt = amount;
        var i=0;
        var pricePerUnitFinal = 0;
        var totalPrice = 0;
        while(updatedAmt > 0 && i <bids.length){
            let size = bids[i][1];
            let perUnitPrice = bids[i][0];
            if(updatedAmt - (size * perUnitPrice) <=0){
                totalPrice = totalPrice + ((updatedAmt / perUnitPrice) * 1);
                console.log('total if ' + totalPrice + ' ' + updatedAmt + ' ' + perUnitPrice);
                updatedAmt = 0;
            }else{
                totalPrice = totalPrice + (size * 1);
                updatedAmt = updatedAmt - (size * perUnitPrice);
                console.log('total else ' + totalPrice + ' ' + perUnitPrice + ' ' + size + ' ' + updatedAmt);
            }
            i++;
        }
        // Check if the bids could not meet the requirement
        if(updatedAmt > 0){
            reject({"error" : "Quantity not available, try with lower quantity!!"});
        }else{
          // Requirement was met
          pricePerUnitFinal = totalPrice / amount;
          var quote = {
              "total"    : totalPrice,
              "price"    : pricePerUnitFinal,
              "currency" : quoteCurrency
          }
          resolve(quote);
        }

      }else{
          reject({"error" : "Nothing available to buy at the moment!!"});
      }
  });
}

function getQuotesFromAsks(asks, amount, quoteCurrency){
  return new Promise(function(resolve, reject) {
      if(asks && asks.length){
        var updatedAmt = amount;
        var i=0;
        var pricePerUnitFinal = 0;
        var totalPrice = 0;
        while(updatedAmt > 0 && i <asks.length){
            var perUnitPrice = asks[i][0];
            var size = asks[i][1];
            console.log(perUnitPrice + ' ' + size);
            console.log(i);
            if((updatedAmt - size) <= 0){
                totalPrice = totalPrice + (updatedAmt * perUnitPrice);
                updatedAmt = 0;
                console.log('total if ' + totalPrice + ' ' + updatedAmt + ' ' + perUnitPrice);
            }else{
                totalPrice = totalPrice + (size  * perUnitPrice);
                updatedAmt = updatedAmt - size ;
                console.log('total else ' + totalPrice + ' ' + (size));
            }
            i++;
        }
        // Check if the asks could not meet the requirement
        if(updatedAmt > 0){
            reject({"error" : "Quantity not available, try with lower quantity!!"});
        }else{
          // Requirement was met
          pricePerUnitFinal = totalPrice / amount;
          var quote = {
              "total"    : totalPrice,
              "price"    : pricePerUnitFinal,
              "currency" : quoteCurrency
          }
          resolve(quote);
        }

      }else{
          reject({"error" : "Nothing available to buy at the moment!!"});
      }
  });

}

function isTradePossible(baseCurrency, quoteCurrency){
  // Check the service response from the orderbook service to determine if the trade is possible
  // Combination 1 (baseCurrency-quoteCurrency)
  return orderbookService.getTradeStatus(baseCurrency, quoteCurrency).then(function(data){
      console.log("success ");
      if(data.statusCode == 200){
        console.log("status is ");
        console.log(typeof data.body);
        bids = JSON.parse(data.body).bids;
        asks = JSON.parse(data.body).asks;
        console.log(asks);
        return true;
      }else{
        // If first Combination didnt work, try reverse Combination
        return orderbookService.getTradeStatus(quoteCurrency, baseCurrency).then(function(data){
          if(data.statusCode == 200){
            // If the currencies are reversed, exchange bids with asks,
            //** buying USD equivalent to selling BTC, so now we need to see bids instead of asks
            currencyReversed = true;
            bids = JSON.parse(data.body).bids;
            asks = JSON.parse(data.body).asks;
            return true;
          }else{
            return false;
          }
        }, errorCallback);
      }
  }, errorCallback);
}

// Get Trade Status Error Callback Handler
function errorCallback(err){
  return false;
}

// Return Router
module.exports = router;
