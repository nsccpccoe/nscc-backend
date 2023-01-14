import * as express from 'express';
import * as admin from 'firebase-admin';
import puppeteer = require("puppeteer");
import { AuthenticatedRequest } from "../middleware/auth";

admin.initializeApp();

const bucket = admin.storage().bucket("nsccpccoe-webxplore-hackathon");
const db = admin.firestore().collection('events').doc('webxplore');
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

interface CustomError {
  isError: true
  errorCode: string
  errorMessage: string
}

interface SubmissionResult {
  isError: false
  data: Submission
}

interface SubmissionsResult {
  isError: false
  data: Submission[]
}

interface UpvoteResult {
  isError: false
}

const screenshot = async (url: string): Promise<{screenshot: string | Buffer, title: string, description: string}> => {
  const browser = await puppeteer.launch({
    defaultViewport: {
      width: 640,
      height: 480,
    },
  });

  const page = await browser.newPage();
  await page.goto(url);
  await page.waitForNavigation();
  const screenshot = await page.screenshot({
    type: "webp",
    quality: 100,
  });
  const title = await page.title();
  const description = '';
  await browser.close();
  return {screenshot, title, description}
}

export const submit = async (req: express.Request, res: express.Response<SubmissionResult | CustomError>) => {
  try {
    const { url } = req.body;
    const user = (<AuthenticatedRequest>req).user

    if(typeof url !== 'string') {
      res.status(400).json({
        isError: true,
        errorCode: 'INVALID_URL',
        errorMessage: 'Please Enter valid Website URL'
      })
      return;
    }

    // create document with id = uid
    const document = db.collection(submissionsCollection).doc(user.uid)
    const filePath = `submissions/${document.id}.webp`
    const submission = await screenshot(url);
    await bucket.file(filePath).save(submission.screenshot);

    const file = await bucket.file(filePath).getMetadata();
    const screenshotURL: string = file.shift().mediaLink;

    const result = await document
      .create({
        title: submission.title,
        link: url,
        screenshot: screenshotURL,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: user.uid,
        description: submission.description
      });

    res.status(201).json({
      isError: false,
      data: {
        id: document.id,
        title: submission.title,
        link: url,
        screenshot: screenshotURL,
        createdAt: result.writeTime.nanoseconds,
        updatedAt: result.writeTime.nanoseconds,
        createdBy: user.uid,
        description: submission.description,
        likes: 0
      }
    });

  } catch (e) {
    res.status(500).json({
      isError: true,
      errorCode: (<Error>e).name,
      errorMessage: (<Error>e).message 
    });
  }
}

export const getSubmissionById = async (req: express.Request, res: express.Response<SubmissionResult | CustomError>) => {
  try {
    const _id: string = req.params.id;
    const submissionSnapshot = await db.collection(submissionsCollection).doc(_id).get()

    if (!submissionSnapshot.exists) {
      res.status(404).send({
        isError: true,
        errorCode: "NOT_FOUND",
        errorMessage: 'Submission Not Found or Has been deleted!',
      })
      return
    }

    const likeSnapshot = await db.collection(likesCollection)
      .where('submission_id', '==', _id)
      .count()
      .get()

    const submission = submissionSnapshot.data() as Submission;
    const likes = likeSnapshot.data().count;

    res.status(201).json({
      isError: false,
      data: {
        id: submissionSnapshot.id,
        title: submission.title,
        link: submission.link,
        screenshot: submission.screenshot,
        createdAt: submission.createdAt,
        updatedAt: submission.updatedAt,
        createdBy: submission.createdBy,
        description: submission.description,
        likes,
      }
    });

  } catch (e) {
    res.status(500).json({
      isError: true,
      errorCode: (<Error>e).name,
      errorMessage: (<Error>e).message
    });
  }
}

export const getAllSubmissions = async (req: express.Request, res: express.Response<SubmissionsResult | CustomError>) => {
  
  try {
    const submissionSnapshot = await db.collection(submissionsCollection).get()

    if (submissionSnapshot.empty) {
      res.status(200).send({
        isError: false,
        data: []
      });
      return;
    }

    const submissionsPromise = submissionSnapshot.docs.map(async (doc) => {
      const submission = doc.data() as Submission

      const likeSnapshot = await db.collection(likesCollection)
        .where('submission_id', '==', doc.id)
        .count()
        .get()

      return {
        id: doc.id,
        title: submission.title,
        link: submission.link,
        screenshot: submission.screenshot,
        createdAt: submission.createdAt,
        updatedAt: submission.updatedAt,
        createdBy: submission.createdBy,
        description: submission.description,
        likes: likeSnapshot.data().count,
      }
    })

    const submissions = (await Promise.allSettled(submissionsPromise)).map(result => {
      if(result.status == 'fulfilled') {
        return result.value
      }
      else {
        return false
      }
    }).filter(Boolean) as Submission[]

    res.status(201).json({
      isError: false,
      data: submissions
    });

  } catch (e) {
    res.status(500).json({
      isError: true,
      errorCode: (<Error>e).name,
      errorMessage: (<Error>e).message
    });
  }
}

export const upvote = async (req: express.Request, res: express.Response<UpvoteResult | CustomError>) => {
  try {
    const { submission_id } = req.body;
    const user = (<AuthenticatedRequest>req).user

    await db.collection(likesCollection)
      .doc(`${submission_id}#${user.uid}`)
      .create({
        submission_id: submission_id,
        uid: user.uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

    res.status(200).json({
      isError: false
    });

  } catch (e) {
    res.status(409).json({
      isError: true,
      errorCode: (<Error>e).name,
      errorMessage: (<Error>e).message
    });
  }
}
