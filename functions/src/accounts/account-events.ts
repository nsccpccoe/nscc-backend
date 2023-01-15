import {region} from "firebase-functions";
import {firestore} from "firebase-admin";

export const newUserRegistered = region("asia-south1").auth.user().onCreate(async (user) => {
  return firestore().collection("accounts")
      .doc(user.uid)
      .create({
        displayName: user.displayName || "Anonymous",
        email: user.email,
      });
});
