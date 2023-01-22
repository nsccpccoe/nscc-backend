import * as functions from "firebase-functions";
import webxploreService from "./webxplore/webxplore-service";
import * as acc from "./accounts/accounts";
import {eventsHandler} from "./events/events";
import {registrationHandler} from "./registration/registration";

// Create an Express object and routes (in order)

// Set our GCF handler to our Express app.
// http://127.0.0.1:5001/nsccpccoe/asia-south1/events
export const webxplore = functions
    .region("asia-south1")
    .runWith({
      memory: "2GB",
    })
    .https.onRequest(webxploreService);

export * from "./accounts/account-events";
export const accounts = functions
    .region("asia-south1")
    .https.onRequest(acc.accountsHandler);

export const events = functions
    .region("asia-south1")
    .https.onRequest(eventsHandler);

export const register = functions
    .region("asia-south1")
    .https.onRequest(registrationHandler);
