import * as express from "express";
import * as admin from "firebase-admin";
import puppeteer = require("puppeteer");
import {AuthenticatedRequest} from "../middleware/auth";
import {CustomError, CustomResult} from "../interfaces/api";

admin.initializeApp();

const bucket = admin.storage().bucket("nsccpccoe-webxplore-hackathon");
const db = admin.firestore().collection("events").doc("webxplore");
const submissionsCollection = "submissions";
const likesCollection = "likes";

interface Submission {
  id: string
  screenshot: string
  title: string
  link: string
  createdAt: number
  updatedAt: number
  createdBy: string
  description: string
  likes: number
}

type SubmissionResult = CustomResult<Submission>
type SubmissionsResult = CustomResult<Submission[]>
type UpvoteResult = CustomResult<undefined>
type LikedSubmissionsResult = CustomResult<string[]>

const screenshot = async (url: string): Promise<{screenshot: string | Buffer, title: string, description: string}> => {
  const browser = await puppeteer.launch({
    defaultViewport: {
      width: 1512,
      height: 982,
    },
    args: [
      "--no-sandbox",
    ],
  });

  const page = await browser.newPage();
  console.log(url);
  await page.goto(url, {
    timeout: 0,
    waitUntil: ["domcontentloaded", "networkidle2"],
  });

  // return {screenshot: "hi",title:'hello', description:'bye'}
  const screenshot = await page.screenshot({
    type: "webp",
    quality: 100,
  });
  const title = await page.title();
  const description = "";
  await browser.close();
  return {screenshot, title, description};
};

export const submit = async (req: express.Request, res: express.Response<SubmissionResult | CustomError>) => {
  try {
    const {url} = req.body;
    const user = (<AuthenticatedRequest>req).user;

    if (typeof url !== "string") {
      res.status(400).json({
        isError: true,
        errorCode: "INVALID_URL",
        errorMessage: "Please Enter valid Website URL.",
      });
      return;
    }

    // create document with id = uid
    // const temp = await db.collection(submissionsCollection).where("createdBy", "==", user.uid).get();
    const temp = await db.collection(submissionsCollection).doc(user.uid).get();
    if (temp.exists) {
      res.status(406).json({
        isError: true,
        errorCode: "SUBMISSION_ALREADY_EXISTS",
        errorMessage: "Submission Already Done.",
      });
      return;
    }

    const document = db.collection(submissionsCollection).doc(user.uid);
    const filePath = `submissions/${document.id}.webp`;
    const submission = await screenshot(url);
    await bucket.file(filePath).save(submission.screenshot, {
      public: true,
    });

    const file = await bucket.file(filePath).getMetadata();
    const screenshotURL: string = file.shift().mediaLink;

    const result = await document
        .set({
          title: submission.title,
          link: url,
          screenshot: screenshotURL,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: user.uid,
          description: submission.description,
        }, {merge: true});

    res.status(201).json({
      isError: false,
      data: {
        id: document.id,
        title: submission.title,
        link: url,
        screenshot: screenshotURL,
        createdAt: result.writeTime.toDate().getTime(),
        updatedAt: result.writeTime.toDate().getTime(),
        createdBy: user.displayName || "Anonymous",
        description: submission.description,
        likes: 0,
      },
    });
  } catch (e) {
    res.status(500).json({
      isError: true,
      errorCode: (<Error>e).name,
      errorMessage: (<Error>e).message,
    });
  }
};

export const getSubmissionById = async (req: express.Request, res: express.Response<SubmissionResult | CustomError>) => {
  try {
    const _id: string = req.params.id;
    const submissionSnapshot = await db.collection(submissionsCollection).doc(_id).get();

    if (!submissionSnapshot.exists) {
      res.status(404).send({
        isError: true,
        errorCode: "SUBMISSION_NOT_FOUND",
        errorMessage: "Submission Not Found or Has been deleted!",
      });
      return;
    }

    const likeSnapshot = await db.collection(likesCollection)
        .where("submissionID", "==", _id)
        .count()
        .get();

    const submission = submissionSnapshot.data() as Submission;
    const likes = likeSnapshot.data().count;
    const user = await admin.auth().getUser(submission.createdBy);

    res.status(201).json({
      isError: false,
      data: {
        id: submissionSnapshot.id,
        title: submission.title,
        link: submission.link,
        screenshot: submission.screenshot,
        createdAt: submission.createdAt,
        updatedAt: submission.updatedAt,
        createdBy: user.displayName || "Anonymous",
        description: submission.description,
        likes,
      },
    });
  } catch (e) {
    res.status(500).json({
      isError: true,
      errorCode: (<Error>e).name,
      errorMessage: (<Error>e).message,
    });
  }
};

export const getAllSubmissions = async (req: express.Request, res: express.Response<SubmissionsResult | CustomError>) => {
  try {
    const submissionSnapshot = await db.collection(submissionsCollection).get();

    if (submissionSnapshot.empty) {
      res.status(200).send({
        isError: false,
        data: [],
      });
      return;
    }

    const submissionsPromise = submissionSnapshot.docs.map(async (doc) => {
      const submission = doc.data() as Submission;

      const likeSnapshot = await db.collection(likesCollection)
          .where("submissionID", "==", doc.id)
          .count()
          .get();

      const user = await admin.auth().getUser(submission.createdBy);

      return {
        id: doc.id,
        title: submission.title,
        link: submission.link,
        screenshot: submission.screenshot,
        createdAt: submission.createdAt,
        updatedAt: submission.updatedAt,
        createdBy: user.displayName || "Anonymous",
        description: submission.description,
        likes: likeSnapshot.data().count,
      };
    });

    const submissions = (await Promise.allSettled(submissionsPromise)).map((result) => {
      if (result.status == "fulfilled") {
        return result.value;
      } else {
        return false;
      }
    }).filter(Boolean) as Submission[];

    res.status(201).json({
      isError: false,
      data: submissions,
    });
  } catch (e) {
    res.status(500).json({
      isError: true,
      errorCode: (<Error>e).name,
      errorMessage: (<Error>e).message,
    });
  }
};

export const upvote = async (req: express.Request, res: express.Response<UpvoteResult | CustomError>) => {
  try {
    const {submissionID} = req.body;
    const user = (<AuthenticatedRequest>req).user;

    await db.collection(likesCollection)
        .doc(`${submissionID}#${user.uid}`)
        .set({
          submissionID: submissionID,
          uid: user.uid,
          timestamp: Date.now(),
          verified: user.emailVerified,
        }, {merge: true});

    res.status(200).json({
      isError: false,
      data: undefined,
    });
  } catch (e) {
    res.status(409).json({
      isError: true,
      errorCode: (<Error>e).name,
      errorMessage: (<Error>e).message,
    });
  }
};

export const likedByUser = async (req: express.Request, res: express.Response<LikedSubmissionsResult | CustomError>) => {
  try {
    const user = (<AuthenticatedRequest>req).user;

    const likedSnapshot = await db.collection(likesCollection)
        .where("uid", "==", user.uid)
        .get();

    const likedPost: string[] = likedSnapshot.docs.map((doc) => doc.data().submissionID);

    res.status(200).json({
      isError: false,
      data: likedPost,
    });
  } catch (e) {
    res.status(409).json({
      isError: true,
      errorCode: (<Error>e).name,
      errorMessage: (<Error>e).message,
    });
  }
};
