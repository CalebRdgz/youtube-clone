import express from "express"
//create local express server

//initialize the express app:
const app = express();

//default port for express app is port 3000:
const port = 3000;

//simple route with root path which takes in request and response
//Define our HTTP GET endpoint:
app.get("/", (req, res) => {
  //specify the functionality in the brackets
  //this is like an anonymous function in typescript
  res.send("Hello World!")
});

//start our server:
app.listen(port, () => { // (=> {}) means "execute this code in the brackets"
    //specify which port were running on:
    console.log(`Video processing service listening at http://localhost:${port}`)
});