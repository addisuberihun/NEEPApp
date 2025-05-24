const scoreRouter=require('../controller/scoreController');
const express=require('express');
const router=express.Router();
router.post('/',scoreRouter);
module.exports=router;
