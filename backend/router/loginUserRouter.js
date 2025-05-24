const user=require('../controller/loginUserController')
const express=require('express')
const router=express.Router()
router.post('/',user);
module.exports=router;