const controller = require('../controller/NoGenerationController');
const express = require('express');
const router = express.Router();


router.post('/AddRules', controller.AddRules);

module.exports = router