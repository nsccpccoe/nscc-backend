import * as express from "express";
import { auth, firestore } from "firebase-admin";
import { UserRecord } from "firebase-admin/auth";
import { CustomError, CustomResult } from "../interfaces/api";
import authMiddleware, { AuthenticatedRequest } from "../middleware/auth";

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: false}));

interface UserStore {
  displayName: string
  email: string
  phoneNumber?: string
  codechef?: string
  codeforces?: string
  hackerrank?: string
  leetcode?: string
}

type UserResult = CustomResult<UserStore & { uid: string }>

app.get("/:uid", async (req, res: express.Response<UserResult | CustomError>) => {
  const uid = req.params.uid as string;
  try {
    const userSnapshot = await firestore()
      .collection("accounts")
      .doc(uid)
      .get();

    if (!userSnapshot.exists) {
      res.status(404).json({
        isError: true,
        errorCode: "NOT_FOUND",
        errorMessage: "User does not exist",
      });
      return;
    }

    const user = userSnapshot.data() as UserStore;

    res.status(200).json({
      isError: false,
      data: {
        uid: userSnapshot.id,
        displayName: user.displayName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        codechef: user.codechef,
        codeforces: user.codeforces,
        hackerrank: user.hackerrank,
      },
    });
  } catch (e) {
    res.status(500).json({
      isError: true,
      errorCode: (<Error>e).name,
      errorMessage: (<Error>e).message,
    });
  }
});

app.post("/update", authMiddleware, async (req: express.Request, res: express.Response<UserResult | CustomError>) => {
  const user = (<AuthenticatedRequest>req).user;
  const { displayName, phoneNumber, codechef, codeforces, hackerrank, leetcode } = req.body;

  const updatedDoc: Partial<UserStore> = {
    displayName,
    phoneNumber,
    codechef,
    codeforces,
    hackerrank,
    leetcode,
  };

  try {
    await firestore().collection("accounts")
      .doc(user.uid)
      .update(<{ [x: string]: string; }>updatedDoc);

    res.status(201).json({
      isError: false,
      data: req.body,
    });
  } catch (e) {
    res.status(500).json({
      isError: true,
      errorCode: (<Error>e).name,
      errorMessage: (<Error>e).message,
    });
  }
});

app.post("/createUserWithEmailAndPassword", (req, res) => {
  const { displayName, email, password } = req.body;
  console.log(req.body)
  auth()
    .createUser({ email, displayName, password })
    .then(function (userRecord: UserRecord) {
      console.log(userRecord);
      auth()
        .createCustomToken(userRecord.uid)
        .then(token => {
          return res.json({
            token
          })
        });
    })
    .catch(function (error) {
      console.error("Failed to create new user");
      console.error(error);
      res.status(500).json({ status: 'error', error: 'Unable to process the request' });
    });
});

export const accountsHandler = app;
