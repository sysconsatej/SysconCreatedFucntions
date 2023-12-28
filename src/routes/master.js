const controller=require('../controller/masterController')
const express=require('express')
const router=express.Router()
 
router.post("/MasterAdd",controller.Add_MasterController)
router.get("/List",controller.list)
router.post("/Insert_into_master",controller.Create_mater)
router.post("/dytablelist",controller.dytablelist)




 


module.exports=router