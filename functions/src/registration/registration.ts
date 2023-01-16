import * as express from "express";
import {firestore} from "firebase-admin";
import {CustomError, CustomResult} from "../interfaces/api";
import * as cors from "cors";
import auth, {AuthenticatedRequest} from "../middleware/auth";

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cors());

interface FieldStore {
  eventId: string,
  fields: {
    name: string,
    label: string,
    value: string | number | null
  }[]
}

const labels:{[key:string]:any} = {
  displayName: 'UserName',
  email: 'Email ID',
  gender: 'Gender',
  collegeName: 'College Name',
  graduationYear: 'Graduation Year',
  hackerrank: 'HackerRank Profile',
  leetcode: 'Leetcode Profile',
  linkedin: 'LinkedIn Profile',
  codechef: 'Codechef Profile',
  phoneNumber: 'Phone Number',
}

type FieldsResult = CustomResult<FieldStore>
type RegisterResult = CustomResult<{eventId: string, registered: boolean}>

app.get("/:eventId/fields", auth, async (req: express.Request, res: express.Response<FieldsResult | CustomError>) => {
  const eventId = req.params.eventId;
  const user = (<AuthenticatedRequest>req).user;

  const eventRef = await firestore().collection('events').doc(eventId).get()
  const requiredFields = eventRef.data()?.requiredUserField
  const recordRef = await firestore().collection('accounts').doc(user.uid).get()
  const userInfo = recordRef.data() as {[key :string] : any}
  
  console.log(requiredFields)
  let missingFields: FieldStore = {eventId:eventId, fields: []};

  requiredFields?.map((field:string) => {
    missingFields.fields?.push({
      name: field,
      label: labels[field],
      value: userInfo[field] !== undefined ? userInfo[field] : null
    })
  })
  console.log(missingFields)
  try {
    res.status(200).json({
      isError: false,
      data: {
        eventId: eventId,
        fields: missingFields.fields!
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

app.get("/:eventId/status", auth, async (req: express.Request, res: express.Response<RegisterResult | CustomError>) => {
  const eventId = req.params.eventId;
  try {
    res.status(200).json({
      isError: false,
      data: {
        eventId: eventId,
        registered: true,
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

app.post("/:eventId", auth, async (req: express.Request, res: express.Response<RegisterResult | CustomError>) => {
  const eventId = req.params.eventId;
  try {
    res.status(200).json({
      isError: false,
      data: {
        eventId: eventId,
        registered: true,
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

export const registrationHandler = app;
