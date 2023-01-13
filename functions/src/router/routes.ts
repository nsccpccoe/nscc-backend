import express = require('express');
import { submit,getPage,getAll,like,update } from '../controller/apis';

const router = express.Router()

router.post('/submit',submit);
router.post('/update',update);
router.get('/page',getPage);
router.get('/all',getAll);
router.post('/like',like)

export default router;