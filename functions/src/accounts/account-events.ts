import {region} from "firebase-functions";
import {firestore} from "firebase-admin";
// import {sendEmailVerificationFromServer} from "./email-verify";

export const newUserRegistered = region("asia-south1").auth.user().onCreate(async (user) => {
  return firestore().collection("accounts")
      .doc(user.uid)
      .set({
        displayName: user.displayName,
        email: user.email,
      }, {merge: true});
});
