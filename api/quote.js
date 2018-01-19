var express = require('express');
var router = express.Router();
var orderbookService = require('../service/order-book-service.js');


router.post('/', function(req,res){
  // Take the API input
  console.log(req.body);
  var action        = req.body.action;
  var baseCurrency  = req.body.base_currency;
  var quoteCurrency = req.body.quote_currency;
  var amount        = req.body.amount;

  // See if the trade is possible
  isTradePossible(baseCurrency, quoteCurrency).then(function(data){
    console.log("Final--");
    console.log(data);
    res.json(data);
  });

});

function isTradePossible(baseCurrency, quoteCurrency){
  // Check the service response from the orderbook service to determine if the trade is possible
  // Combination 1 (baseCurrency-quoteCurrency)
  return orderbookService.getTradeStatus(baseCurrency, quoteCurrency).then(function(data){
      console.log("success ");
      if(data.statusCode == 200){
        console.log("status is ")
        return {"status" : true};
      }else{
        // If first Combination didnt work, try another
        return orderbookService.getTradeStatus(quoteCurrency, baseCurrency).then(function(data){
          if(data.statusCode == 200){
            return {"status" : true};
          }else{
            return {"status" : false};
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
