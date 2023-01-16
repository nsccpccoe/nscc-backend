import * as express from "express";
import {firestore} from "firebase-admin";
import {CustomError, CustomResult} from "../interfaces/api";
import * as cors from "cors";

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cors());

interface EventStore {
  displayName: string
  subtitle: string
  description: string
  endAt: number
  startAt: number
  featured: boolean
  organizers: {
    displayName: string
    shortName: string
  }[],
  registration: {
    type: "onsite" | "offsite",
    link: string,
  }
  eventPage: {
    link: string
    type: "onsite" | "offsite",
  }
}

type EventsResult = CustomResult<(EventStore & { id: string})[]>

app.get("/", async (req: express.Request, res: express.Response<EventsResult | CustomError>) => {
  try {
    const eventsSnapshot = await firestore()
        .collection("events")
        .get();

    if (eventsSnapshot.empty) {
      res.status(404).json({
        isError: false,
        data: [],
      });
      return;
    }

    const events: EventsResult["data"] = eventsSnapshot.docs.map((events) => {
      const eventData = events.data() as EventStore;
      return {
        id: events.id,
        displayName: eventData.displayName,
        description: eventData.description,
        subtitle: eventData.subtitle,
        endAt: (<firestore.Timestamp><unknown>eventData.endAt).toDate().getTime(),
        startAt: (<firestore.Timestamp><unknown>eventData.startAt).toDate().getTime(),
        organizers: eventData.organizers,
        eventPage: eventData.eventPage,
        featured: eventData.featured,
        registration: eventData.registration,
      };
    });

    res.status(200).json({
      isError: false,
      data: events,
    });
  } catch (e) {
    res.status(500).json({
      isError: true,
      errorCode: (<Error>e).name,
      errorMessage: (<Error>e).message,
    });
  }
});

export const eventsHandler = app;
