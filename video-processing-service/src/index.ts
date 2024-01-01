import express from "express"
import { convertVideo, deleteProcessedVideo, deleteRawVideo, downloadRawVideo, setupDirectories, uploadProcessedVideo } from "./storage";
//create local express server

setupDirectories();

//initialize the express app:
const app = express();
app.use(express.json()); //middleware to handle the JSON requests
//this endpoint wont be invoked by user or us, but by Pub/Sub message queue:
app.post("/process-video", async (req, res) => {
    //Get the bucket and filename from the Cloud Pub/Sub message
    let data;
    try {
        const message = Buffer.from(req.body.message.data, 'base64').toString('utf8');
        data = JSON.parse(message); //parse the data from JSON string to Javascript
        if (!data.name) {
            throw new Error('Invalid message payload received.')
        }
    } catch (error) {
        console.error(error);
        return res.status(400).send('Bad Request: missing filename.')
    }

    //define the file names:
    const inputFileName = data.name;
    //this is what we call the output file after processing it:
    const outputFileName = `processed-${inputFileName}`

    //Download the raw video from Cloud Storage:
    await downloadRawVideo(inputFileName);

    //Convert the video to 360p
    try {
        await convertVideo(inputFileName, outputFileName); //await = wait to finish converting before uploading
    } catch (err) {
        await Promise.all([deleteRawVideo(inputFileName),
        deleteProcessedVideo(outputFileName)
        ]);
        console.error(err);
        return res.status(500).send('Internal Server Error: video processing failed.')
    }

    //Upload the processed video to Cloud Storage:
    await uploadProcessedVideo(outputFileName);

    await Promise.all([
      deleteRawVideo(inputFileName),
      deleteProcessedVideo(outputFileName),
    ]);

    return res.status(200).send('Processing finished successfully.')
});

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
});

//if process.env.PORT is undefined, set port as 3000:
const port = process.env.PORT || 3000;

//start our server:
app.listen(port, () => { // (=> {}) means "execute this code in the brackets"
    //specify which port were running on:
    console.log(`Video processing service listening at http://localhost:${port}`)
});