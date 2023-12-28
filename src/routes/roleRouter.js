const controller = require("../controller/roleController.js");
const express = require('express');
const router = express.Router();

router.post('/add',controller.addRole)
router.get('/list',controller.lisRole)






module.exports = router