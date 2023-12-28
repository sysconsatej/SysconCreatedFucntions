const express=require('express')
const router=express.Router();
const controller=require('../controller/FormControlCon')

router.post('/add',controller.Formcontrol)
router.get('/List',controller.listControlToDrowScreen)


module.exports=router