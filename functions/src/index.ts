import * as functions from "firebase-functions";
import * as express from "express";
import webxplore from "./webxplore/webxplore-routes";

// Create an Express object and routes (in order)
const app = express();

app.use("/webxplore", webxplore);

// Set our GCF handler to our Express app.
// http://127.0.0.1:5001/nsccpccoe/asia-south1/events
export const events = functions.region("asia-south1").https.onRequest(app);
