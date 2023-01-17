import * as express from "express";
import {firestore} from "firebase-admin";
import {CustomError, CustomResult} from "../interfaces/api";
import * as cors from "cors";
import auth, {AuthenticatedRequest} from "../middleware/auth";
import {Field, fields} from "./fields";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: false}));

const db = firestore();

interface FieldStore {
  eventId: string,
  fields: (Field & { value: string })[]
}

type FieldsResult = CustomResult<FieldStore>
type RegisterResult = CustomResult<{ eventId: string, registered: boolean }>

app.get("/:eventId/fields", auth, async (req: express.Request, res: express.Response<FieldsResult | CustomError>) => {
  try {
    const eventId = req.params.eventId;
    const user = (<AuthenticatedRequest>req).user;

    const eventSnapshot = await db.collection("events").doc(eventId).get();
    const eventData = eventSnapshot.data();

    if (!eventSnapshot.exists || eventData === undefined) {
      res.status(500).json({
        isError: true,
        errorCode: "NOT_FOUND",
        errorMessage: "Event Not Found",
      });
      return;
    }

    const requiredFields: string[] = eventData.requiredUserField || [];

    if (requiredFields.length == 0) {
      res.status(200).json({
        isError: false,
        data: {
          eventId,
          fields: [],
        },
      });
      return;
    }

    const recordSnapshot = await db.collection("accounts").doc(user.uid).get();
    const userInfo = recordSnapshot.data() as { [key: string]: string };

    if (!recordSnapshot.exists || userInfo === undefined) {
      res.status(404).json({
        isError: true,
        errorCode: "USER_NOT_FOUND",
        errorMessage: "Registered user is not found is Database, Please contact nscc@pccoepune.org",
      });
      return;
    }

    const missingFields: FieldStore = {eventId: eventId, fields: []};

    requiredFields.map((fieldName: string) => {
      // case when field detail is missing from backend list
      const field = fields.filter((field) => field.name == fieldName)[0] || {
        type: "text",
        name: fieldName,
        label: fieldName,
        placeholder: fieldName,
        value: fieldName in userInfo ? userInfo[fieldName] : "",
        mutable: true,
        regex: ".+",
      };

      if (field.type == "text") {
        missingFields.fields.push({
          type: field.type,
          name: field.name,
          label: field.label,
          placeholder: field.placeholder,
          value: fieldName in userInfo ? userInfo[fieldName] : "",
          mutable: field.mutable,
          regex: field.regex,
        });
      } else {
        missingFields.fields.push({
          type: field.type,
          name: field.name,
          label: field.label,
          value: fieldName in userInfo ? userInfo[fieldName] : "",
          mutable: field.mutable,
          options: field.options,
        });
      }
    });

    res.status(200).json({
      isError: false,
      data: missingFields,
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
  try {
    const eventId = req.params.eventId;
    const user = (<AuthenticatedRequest>req).user;

    const registeredRef = await db.collection("events").doc(eventId).collection("registrations").doc(user.uid).get();

    res.status(200).json({
      isError: false,
      data: {
        eventId: eventId,
        registered: registeredRef.exists,
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
  try {
    const eventId = req.params.eventId;
    const user = (<AuthenticatedRequest>req).user;

    const eventSnapshot = await db.collection("events").doc(eventId).get();
    const eventData = eventSnapshot.data();

    if (!eventSnapshot.exists || eventData === undefined) {
      res.status(500).json({
        isError: true,
        errorCode: "NOT_FOUND",
        errorMessage: "Event Not Found",
      });
      return;
    }

    const requiredFields: string[] = eventData.requiredUserField || [];

    const userData: Record<string, string> = {};

    requiredFields.forEach((fieldName) => {
      if (fieldName in req.body) {
        const field = fields.filter((field) => field.name === fieldName)[0];
        if (field && field.mutable === false) {
          // ignore immutable fields
          console.log("Immutable Field: ", field);
        } else {
          userData[fieldName] = req.body[fieldName];
        }
      } else {
        res.status(400).json({
          isError: true,
          errorCode: "REQUIRED_FIELD_MISSING",
          errorMessage: `${fieldName} in Required but not passed!`,
        });
        return;
      }
    });

    if (Object.entries(userData).length > 0) {
      await db.collection("accounts").doc(user.uid).update(userData);
    }

    await db.collection("events").doc(eventId).collection("registrations").doc(user.uid).update({
      eventId: eventId,
      uid: user.uid,
      modifiedAt: new Date(),
      ...userData,
    });

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
