var request = require("request");

function getTradeStatusFromOrderBookService(currency1, currency2){
  let url = 'https://api.gdax.com/products/' + currency1 + '-' + currency2 + '/book';
  let options = {
        url: url,
        headers: {
            'User-Agent': 'request'
        }
    };


  console.log(url);
    return new Promise(function(resolve, reject) {
        console.log('Inside Promise');
        request.get(options , function(err, res, body) {
            if(res.statusCode==400){
              console.log('Status: ' + res.statusCode);
                console.log('Error is ');
                console.log(err);
                console.log(res);
                console.log(body);
                reject(err);
            }else{
                console.log('Status: ' + res.statusCode);
                console.log(body);
                resolve(res);
            }
        });


    });

}

exports.getTradeStatus = getTradeStatusFromOrderBookService;
