import express = require("express");
import auth from "../middleware/auth";
import { submit, getSubmissionById, getAllSubmissions, upvote } from "./webxplore-controller";

const app = express();

app.post("/submit", auth, submit);
app.get("/submissions/:id", getSubmissionById);
app.get("/submissions", getAllSubmissions);
app.post("/upvote", auth, upvote);

export default app;