import {region} from "firebase-functions";
import {firestore} from "firebase-admin";

export const newUserRegistered = region("asia-south1").auth.user().onCreate(async (user) => {
  // if(!user.emailVerified) {
  //   auth().generateEmailVerificationLink
  // }
  return firestore().collection("accounts")
      .doc(user.uid)
      .set({
        displayName: user.displayName,
        email: user.email,
      }, {merge: true});
});
