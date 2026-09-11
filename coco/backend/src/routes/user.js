const express = require('express');
const controller = require('../controllers/userController');

const router = express.Router();

router.post('/preferences', controller.savePreferences);
router.get('/feed', controller.getFeed);
router.post('/push-token', controller.registerPushToken);

module.exports = router;
