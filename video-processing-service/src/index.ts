import express from "express"
import Ffmpeg from "fluent-ffmpeg"
//create local express server

//initialize the express app:
const app = express();
app.use(express.json()); //middleware to handle the JSON requests

//simple route with root path which takes in request and response
//Define our HTTP POST endpoint:
app.post("/process-video", (req, res) => {
  //Get path of the input video file from the request body
  const inputFilePath = req.body.inputFilePath; //from the request body
  const outputFilePath = req.body.outputFilePath; //same thing for the output

  //error handling technique if inputFilePath/outputFilePath are not given by the user:
  if (!inputFilePath || !outputFilePath) {
    res.status(400).send("Bad Request: Missing file path.") //send error 400 - client(user) error
  }
  //Actually converting the video:
  Ffmpeg(inputFilePath) //running imported ffmpeg and call it on the input file
    .outputOptions("-vf", "scale=-1:360") //(video file, scale video resolution to 360p)
    //chain this^ with "end" and "error" events:
    .on("end", () => {
        //Anonymous Function
        res.status(200).send("Video processing finished successfully.");
    })
    .on("error", (err) => { //anonymous function with the (err) object
        console.log(`An error occurred: ${err.message}`)
        res.status(500).send(`Internal Server Error: ${err.message}`) //send internal server error
    })
    .save(outputFilePath);
});

//if process.env.PORT is undefined, set port as 3000:
const port = process.env.PORT || 3000;

//start our server:
app.listen(port, () => { // (=> {}) means "execute this code in the brackets"
    //specify which port were running on:
    console.log(`Video processing service listening at http://localhost:${port}`)
});