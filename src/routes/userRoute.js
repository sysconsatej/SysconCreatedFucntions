const express = require('express');
const router = express.Router();
const controller = require('../controller/userController');

router.post('/add', controller.addUser)
router.post('/login', controller.login)
router.post('/verifyOtp', controller.VerifyOtp)
router.post('/forgotPassword', controller.forgotPassword)
router.post('/changePassword', controller.changePassword)













module.exports = router
