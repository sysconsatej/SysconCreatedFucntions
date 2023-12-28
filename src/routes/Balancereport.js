const Controller = require('../controller/Balance_scheet_reportCon');
const blController = require('../controller/FormControlCon');
const express=require('express');
const router=express.Router();

router.post('/report',Controller.report);
router.post('/list',Controller.list);
router.post('/add',blController.add);
router.post('/formcontrol',blController.Formcontrol);




module.exports=router