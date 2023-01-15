import * as express from "express";
import {CustomError, CustomResult} from "../interfaces/api";
import * as cors from "cors";
import auth from "../middleware/auth";

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

type FieldsResult = CustomResult<FieldStore>
type RegisterResult = CustomResult<{eventId: string, registered: boolean}>

app.get("/:eventId/fields", auth, async (req: express.Request, res: express.Response<FieldsResult | CustomError>) => {
  const eventId = req.params.eventId;
  try {
    res.status(200).json({
      isError: false,
      data: {
        eventId: eventId,
        fields: [
          {
            name: "displayName",
            label: "Full Name",
            value: null,
          },
          {
            name: "email",
            label: "Email",
            value: "lorem@example.com",
          },
          {
            name: "hackerrank",
            label: "HackerRank Profile Link",
            value: null,
          },
        ],
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
