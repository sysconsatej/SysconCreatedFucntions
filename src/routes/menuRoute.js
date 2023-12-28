const express=require('express')
const router=express.Router()
const controller=require('../controller/menuController')
router.post('/add',controller.addMenu)
router.post('/list',controller.listMenu)




module.exports=router