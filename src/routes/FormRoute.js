const express=require('express')
const router=express.Router();
const controller=require('../controller/FormControlCon')

router.post('/add',controller.Formcontrol)
router.get('/List',controller.listControlToDrowScreen)
router.post('/addQuotation',controller.addQuotation)
router.post('/addBooking',controller.addBooking)


module.exports=router