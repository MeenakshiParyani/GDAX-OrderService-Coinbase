let express = require('express');
let router = express.Router();
let orderbookService = require('../service/order-book-service.js');
let bids = [];
let asks = [];
let currencyReversed;

router.post('/', function(req,res){
    currencyReversed = false;
    // console.log(req.body);
    // Take the API input
    const action        = req.body.action;
    const baseCurrency  = req.body.base_currency;
    const quoteCurrency = req.body.quote_currency;
    const amount        = req.body.amount;

    // Checking the response from the orderbook service to determine if the trade is possible for given currencies
    isTradePossible(baseCurrency, quoteCurrency).then(function(status){
        // If Orderbook is present (status == true)
        if(status){
            if(action == 'buy' || action == 'sell'){
                //** As in case of BTC-USD/ USD-BTC, orderbook has BTC values only (only for one currency at a time)
                // To handle this, using generic function to determine if its a buy/sell operation for that currency using
                // currencyReversed flag
                //for ex - buying USD is equivalent to selling BTC, similar thing applies to other currency conversions
                currencyReversed ? sellCurrency(bids, amount, quoteCurrency, res) : buyCurrency(asks, amount, quoteCurrency, res);
            }else{
                res.status(400).json({"error" : "Invalid action, Please choose from buy/sell!!"});
            }
        }else{//If Orderbook is not present
          res.status(400).json({"error" : "Given Currencies can not be traded!!"});
        }
    });

});

function isTradePossible(baseCurrency, quoteCurrency){
  // Check the service response from the orderbook service to determine if the trade is possible for given currencies
  // Combination 1 (baseCurrency-quoteCurrency)
  return orderbookService.getTradeStatus(baseCurrency, quoteCurrency).then(function(data){
      if(data.statusCode == 200){
        bids = JSON.parse(data.body).bids;
        asks = JSON.parse(data.body).asks;
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

// Using asks for buying
function buyCurrency(asks, amount, quoteCurrency, res){
    console.log('Buying in ' + quoteCurrency);
    getQuotesFromAsks(asks, amount, quoteCurrency)
    .then(function(response){
        res.status(200).json(response);
    })
    .catch(function(err){
        res.status(400).json(err);
    });
}

// Using bids for selling
function sellCurrency(bids, amount, quoteCurrency, res){
    console.log('Selling in ' + quoteCurrency);
    getQuotesFromBids(bids, amount, quoteCurrency)
    .then(function(response){
        res.status(200).send(response);
    })
    .catch(function(err){
        res.status(400).json(err);
    });
}

function getQuotesFromBids(bids, amount, quoteCurrency, currencyReversed){
  return new Promise(function(resolve, reject) {
      if(bids && bids.length){
        let updatedAmt = amount;
        let i=0;
        let pricePerUnitFinal = 0;
        let totalPrice = 0;
        // Keep interating through bids till the currency amount requirement is met
        while(updatedAmt > 0 && i <bids.length){
            let size = bids[i][1];
            let perUnitPrice = bids[i][0];
            if(updatedAmt - (size * perUnitPrice) <=0){
                // Last iteration, take only the amount that is required to sell the total amount of currency
                totalPrice = totalPrice + ((updatedAmt / perUnitPrice) * 1);
                updatedAmt = 0;
            }else{
                // Continuing iteration, take up all the amount offered by the bid
                totalPrice = totalPrice + (size * 1);
                updatedAmt = updatedAmt - (size * perUnitPrice);
            }
            i++;
        }
        // Check if the bids could not meet the requirement
        if(updatedAmt > 0){
            reject({"error" : "Quantity not available, try with lower quantity!!"});
        }else{
          // Requirement was met
          pricePerUnitFinal = totalPrice / amount;
          let quote = {
              "total"    : totalPrice,
              "price"    : pricePerUnitFinal,
              "currency" : quoteCurrency
          }
          resolve(quote);
        }

      }else{
          reject({"error" : "Nothing available to trade at the moment!!"});
      }
  });
}

function getQuotesFromAsks(asks, amount, quoteCurrency){
  return new Promise(function(resolve, reject) {
      if(asks && asks.length){
        let updatedAmt = amount;
        let i=0;
        let pricePerUnitFinal = 0;
        let totalPrice = 0;
        // Keep interating through asks till the currency amount requirement is met
        while(updatedAmt > 0 && i <asks.length){
            let perUnitPrice = asks[i][0];
            let size = asks[i][1];
            console.log(perUnitPrice + ' ' + size);
            console.log(i);
            if((updatedAmt - size) <= 0){
               // Last iteration, take only the amount that is required to sell the total amount of currency
                totalPrice = totalPrice + (updatedAmt * perUnitPrice);
                updatedAmt = 0;
            }else{
               // Continuing iteration, take up all the amount offered by the ask
                totalPrice = totalPrice + (size  * perUnitPrice);
                updatedAmt = updatedAmt - size ;
            }
            i++;
        }
        // Check if the asks could not meet the requirement
        if(updatedAmt > 0){
            reject({"error" : "Quantity not available, try with lower quantity!!"});
        }else{
          // Requirement was met
          pricePerUnitFinal = totalPrice / amount;
          let quote = {
              "total"    : totalPrice,
              "price"    : pricePerUnitFinal,
              "currency" : quoteCurrency
          }
          resolve(quote);
        }

      }else{
          reject({"error" : "Nothing available to trade at the moment!!"});
      }
  });

}

// Get Trade Status Error Callback Handler
function errorCallback(err){
  return false;
}

// Return Router
module.exports = router;
