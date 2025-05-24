const entranceleaderController=require('../../controller/leaderboard/entranceleaderController');
const express=require('express');
const router=express.Router();
router.get('/',entranceleaderController);
module.exports = router