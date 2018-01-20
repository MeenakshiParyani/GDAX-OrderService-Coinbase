# GDAX-OrderService-Coinbase

#### Steps for installing and Running the service	
 		
 ```		
 > cd GDAX-OrderService-Coinbase	
 > npm install	
 > npm start
 > Access the API endpoint at http://localhost:3000/api/quote (Post Request)
 > Provide the input body as below :-
   {
	    "action" : "sell",
	    "base_currency" : "USD",
	    "quote_currency" : "BTC",
	    "amount" : "10000"
   }
 > Alternatively, Import the postman collection json under the directory and run the Get Quote API
 
 ```
