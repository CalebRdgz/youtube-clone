//1. GCS file interactions
//2. Local file interactions
import { Storage } from "@google-cloud/storage";
import fs from 'fs'; //file system
import Ffmpeg from "fluent-ffmpeg";

//creating an instance of GCS(Google Cloud Storage) Library:
const storage = new Storage();

//bucket names have to be GLOBALLY unique:
const rawVideoBucketName = "calebrdgz-raw-videos";
//upload the processed version of the video into this separate GCS Bucket:
const processedVideoBucketName = "calebrdgz-processed-videos";

//use local paths to stay organized:
//when we download the raw videos from the buckets, put them in these folders locally in my PC:
const localRawVideoPath = "./raw-videos";
const localProcessedVideoPath = "./processed-videos";
//delete these downloaded local video files to avoid filling my PC's storage/resources

//define functions:
//Creates the local directories for raw and processed videos:
//get raw video files and put them in raw folder, then process them and put them in processed folder
export function setupDirectories() {
    ensureDirectoryExistence(localRawVideoPath);
    ensureDirectoryExistence(localProcessedVideoPath);
}

//conversion code:
/**
* @param rawVideoName - The name of the file to convert from {@link localRawVideoPath}
* @param processedVideoName - The name of the file to convert to {@link localProcessedVideoPath}
* @returns A promise that resolves when the video has been converted.
*/
export function convertVideo(rawVideoName: string, processedVideoName: string) {
    //Javascript Promise:
    //this allows us (at run-time) to resolve or reject the promise either return error or value
    //<void> because we are not returning a value when resolving
    return new Promise<void>((resolve, reject) => {
      //Actually converting the video:
      Ffmpeg(`${localRawVideoPath}/${rawVideoName}}`) //location of the raw video/name of raw video
        .outputOptions("-vf", "scale=-1:360") //(video file, scale video resolution to 360p)
        //chain this^ with "end" and "error" events:
        .on("end", () => {
          //Anonymous Function
          console.log("Video processing finished successfully.");
          resolve();
        })
        .on("error", (err) => {
          //anonymous function with the (err) object
          console.log(`An error occurred: ${err.message}`);
          //let the outside world know that there was an error:
          reject(err);
        })
        .save(`${localProcessedVideoPath}/${processedVideoName}`);
    });
}

/**
 * @param fileName - The name of the file to download from the
 * {@link rawVideoBucketName} bucket into the {@link localRawVideoPath} folder.
 * @returns A promise that resolves when the file has been downloaded.
 */
//simple API (figure out what the fileName is and download it):
export async function downloadRawVideo(fileName: string) {
    //specify the bucket:
    //asynchronous = will always return a promise
    //await = block any other function from running until this one is finished running:
    await storage.bucket(rawVideoBucketName)
    .file(fileName) //which file are we going to download
    .download({destination: `${localRawVideoPath}/${fileName}`}) //specify that we want to download it

    //Google Storage bucket paths always start with gs://
    //Google Storage files downloaded to Local files:
    console.log(
        `gs://${rawVideoBucketName}/${fileName} downloaded to ${localRawVideoPath}/${fileName}`
    )
}

/**
 * @param fileName - The name of the file to upload from the
 * {@link localProcessedVideoPath} folder into the {@link processedVideoBucketName"}.
 * @returns A promise that resolves when the file has been uploaded.
 */
export async function uploadProcessedVideo(fileName: string) {
    //declare variable for the bucket
    const bucket = storage.bucket(processedVideoBucketName);

    //uploading from our local processed video folder
    bucket.upload(`${localProcessedVideoPath}/${fileName}`, {
        destination: fileName
    });
    //local video has been uploaded to the GCS bucket:
    console.log(`${localProcessedVideoPath}/${fileName} uploaded to gs://${processedVideoBucketName}/${fileName}.`)

    //set that file to be public:
    await bucket.file(fileName).makePublic();
}

/**
 * @param fileName - The name of the file to delete from the
 * {@link localRawVideoPath} folder.
 * @returns A promise that resolves when the file has been deleted.
 */
//delete videos from the local raw folder:
export function deleteRawVideo(fileName: string) {
    return deleteFile(`${localRawVideoPath}/${fileName}`)
}

/**
 * @param fileName - The name of the file to delete from the
 * {@link localProcessedVideoPath} folder.
 * @returns A promise that resolves when the file has been deleted.
 */
//delete videos from the local raw folder:
export function deleteProcessedVideo(fileName: string) {
    return deleteFile(`${localProcessedVideoPath}/${fileName}`)
}

/**
 * @param filePath - The path of the file to delete.
 * @returns A promise that resolves when the file has been deleted.
 */
//do some cleaning up, dont want a bunch of raw/processed videos in our local path
function deleteFile(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(filePath)) {
            //fastest way to delete a file (marking the file as deleted, not actually deleting):
            fs.unlink(filePath, (err) => {
                if (err) {
                  //print the error at the same time as this message:
                  console.log(`Failed to delete file at ${filePath}`, err);
                  //reject the promise with that err
                  reject(err);
                } else {
                    console.log(`File deleted at ${filePath}.`)
                    resolve();
                }
                
            })
        } else {
            console.log(`File not found at ${filePath}, skipping the delete.`);
            resolve();
        }
    });
}

/**
 * Ensures a directory exists, creating it if necessary.
 * @param {string} dirPath - The directory path to check.
 */
function ensureDirectoryExistence(dirPath: string) {
    //if the directory does not exist, create it
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true }); //recursive: true enables creating nested directories
        console.log(`Directory created at ${dirPath}`);
    }
}