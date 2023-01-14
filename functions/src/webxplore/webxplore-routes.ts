import express = require("express");
import auth from "../middleware/auth";
import { submit, getSubmissionById, getAllSubmissions, upvote, update } from "./webxplore-controller";

const router = express.Router();

router.post("/submit", auth, submit);
// router.post("/update", update);
router.get("/submissions/:id", getSubmissionById);
router.get("/submissions", getAllSubmissions);
router.post("/upvote", auth, upvote);

export default router;
