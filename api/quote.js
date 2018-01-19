var express = require('express');
var router = express.Router();
var orderbookService = require('../service/order-book-service.js');
var bids = [];
var asks = [];

router.post('/', function(req,res){
  // Take the API input
  console.log(req.body);
  var action        = req.body.action;
  var baseCurrency  = req.body.base_currency;
  var quoteCurrency = req.body.quote_currency;
  var amount        = req.body.amount;

  // See if the trade is possible
  isTradePossible(baseCurrency, quoteCurrency).then(function(status){
      console.log("Final--");
      console.log(status);
      if(status){// If Orderbook is present
          //res.json(true);


          switch(action){
             case 'buy'  : getQuotesFromAsks(asks).then(function(quote){
                              res.json(quote);
                           });
                           break;
             case 'sell' : getQuotesFromBids(bids).then(function(quote){
                              res.json(quote);
                           });
                           break;
             default     : res.json({"error" : "Invalid action, Please choose from buy/sell"});

          }


      }else{//If Orderbook is not present
        res.json({"error" : "Given Currencies can not be traded"});
      }

  });

});

function getQuotesFromBids(bids){
    console.log(bids);
    bids = sortByPrice(bids);

}

function getQuotesFromAsks(asks){
    console.log(asks);
    asks = sortByPrice(asks);
}

// Sort the bids and asks by price which is the first value of the array
function sortByPrice(items){
    items.sort(function (itemA, itemB) {
      if (itemA[0] === itemB[0]) {
          return 0;
      }
      else {
          return (itemA[0] < itemB[0]) ? -1 : 1;
      }
    });
    return items;
}

function isTradePossible(baseCurrency, quoteCurrency){
  // Check the service response from the orderbook service to determine if the trade is possible
  // Combination 1 (baseCurrency-quoteCurrency)
  return orderbookService.getTradeStatus(baseCurrency, quoteCurrency).then(function(data){
      console.log("success ");
      if(data.statusCode == 200){
        console.log("status is ");
        console.log(data.body.bids);
        bids = data.body.bids;
        asks = data.body.asks;
        return true;
      }else{
        // If first Combination didnt work, try reverse Combination
        return orderbookService.getTradeStatus(quoteCurrency, baseCurrency).then(function(data){
          if(data.statusCode == 200){
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
  console.log("success ");
  return false;
}

// Return Router
module.exports = router;
