const express = require('express');
const MemeController = require('../controllers/memeController');

const router = express.Router();

router.post('/memes', MemeController.addMeme);

module.exports = router;