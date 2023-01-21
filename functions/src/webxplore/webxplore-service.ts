import express = require("express");
import auth from "../middleware/auth";
import {submit, getSubmissionById, getAllSubmissions, upvote, likedByUser} from "./webxplore-controller";
import * as cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.post("/submit", auth, submit);
app.get("/submissions/:id", getSubmissionById);
app.get("/submissions", getAllSubmissions);
app.post("/upvote", auth, upvote);
app.get("/likedSubmissions", auth, likedByUser);

export default app;
