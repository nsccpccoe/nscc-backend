import express = require("express");
import admin = require("firebase-admin");
import puppeteer = require("puppeteer");

admin.initializeApp();

var bucket = admin.storage().bucket("nsccpccoe.appspot.com");
const collectionPath = "webxplore/2023";

export const submit = async (req: express.Request, res: express.Response) => {
  try {
    const body = req.body;
    puppeteer
      .launch({
        defaultViewport: {
          width: 640,
          height: 480,
        },
      })
      .then(async (browser) => {
        const page = await browser.newPage();
        await page.goto(body.url);
        const screenshot = await page.screenshot({
          type: "jpeg",
          quality: 100,
        });
        await bucket.file(`/webxplore/${body.id}.jpeg`).save(screenshot);
        const file = await bucket
          .file(`/webxplore/${body.id}.jpeg`)
          .getMetadata();
        const url: string = file.shift().mediaLink;
        const title = await page.title();
        const time = admin.firestore.FieldValue.serverTimestamp();
        await admin
          .firestore()
          .collection(collectionPath + "/submissions")
          .doc(body["id"])
          .create({
            title: title,
            link: body.url,
            screenshot: url,
            timeStamp: time,
          });
        await browser.close();
      });
    res.status(201).json({});
  } catch (e) {
    res.status(409).json({ message: (<Error>e).message });
  }
};

export const update = async (req: express.Request, res: express.Response) => {
  try {
    const body = req.body;
    puppeteer
      .launch({
        defaultViewport: {
          width: 640,
          height: 480,
        },
      })
      .then(async (browser) => {
        const page = await browser.newPage();
        await page.goto(body.url);
        await page.waitForNavigation();
        const screenshot = await page.screenshot({
          type: "jpeg",
          quality: 100,
        });
        await bucket.file(`/webxplore/${body.id}.jpeg`).save(screenshot);
        const file = await bucket
          .file(`/webxplore/${body.id}.jpeg`)
          .getMetadata();
        const url: string = file.shift().mediaLink;
        const title = await page.title();
        const time = admin.firestore.FieldValue.serverTimestamp();
        await admin
          .firestore()
          .collection(collectionPath + "/submissions")
          .doc(body["id"])
          .update({
            title: title,
            link: body.url,
            screenshot: url,
            timeStamp: time,
          });
        await browser.close();
      });
    res.status(201).json({});
  } catch (e) {
    res.status(409).json({ message: (<Error>e).message });
  }
};

export const getPage = async (req: express.Request, res: express.Response) => {
  try {
    const _id: any = req.query.id;
    const response = await admin
      .firestore()
      .collection(collectionPath + "/submissions")
      .doc(_id)
      .get();
    const likes = await admin
      .firestore()
      .collection(collectionPath + "/likes")
      .where("postID", "==", _id)
      .get();
    const likes_id: Array<string> = [];
    likes.docs.map((doc) => {
      likes_id.push(doc.data().userID);
    });
    if (!response.exists) {
      res.status(404).send("Document not Found");
    } else {
      const page = {
        _id: response.id,
        title: response.data()?.title,
        link: response.data()?.url,
        likeCount: likes.size,
        likedBy: likes_id,
        screenshot: response.data()?.screenshot,
        timestamp: response.data()?.timeStamp,
      };

      res.status(200).json(page);
    }
  } catch (e) {
    res.status(409).json({ message: (<Error>e).message });
  }
};

export const getAll = async (req: express.Request, res: express.Response) => {
  try {
    const response = await admin
      .firestore()
      .collection(collectionPath + "/submissions")
      .get();
    const docs_list: Array<object> = [];
    response.docs.map(async (doc) => {
      docs_list.push({
        _id: doc.id,
        title: doc.data().title,
        link: doc.data().url,
        screenshot: doc.data().screenshot,
        timestamp: doc.data().timeStamp,
      });
    });
    res.status(200).json(docs_list);
  } catch (e) {
    res.status(409).json({ message: (<Error>e).message });
  }
};

export const like = async (req: express.Request, res: express.Response) => {
  try {
    const doc_id = req.body.doc_id;
    const uid = req.body.uid;
    const time = admin.firestore.FieldValue.serverTimestamp();
    const response = await admin
      .firestore()
      .collection(collectionPath + "/likes")
      .doc(`${doc_id}#${uid}`)
      .create({ postID: doc_id, userID: uid, timestamp: time });
    res.status(200).json(response);
  } catch (e) {
    res.status(409).json({ message: (<Error>e).message });
  }
};
