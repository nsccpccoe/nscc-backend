import * as functions from "firebase-functions";
import webxploreService from "./webxplore/webxplore-service";
import * as acc from "./accounts";

// Create an Express object and routes (in order)

// Set our GCF handler to our Express app.
// http://127.0.0.1:5001/nsccpccoe/asia-south1/events
export const webxplore = functions.region("asia-south1").https.onRequest(webxploreService);

export const accounts = functions.region("asia-south1")
    .https.onRequest(acc.accountsHandler);

export const saveNewUserToDb = acc.saveNewUserToDb;
