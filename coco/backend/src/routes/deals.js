const express = require('express');
const controller = require('../controllers/dealsController');

const router = express.Router();

// Order matters: static/action routes must be registered before the
// dynamic `/:id` route, otherwise Express would treat "trending" or
// "category" as a deal id.
router.get('/trending', controller.trending);
router.get('/expiring', controller.expiring);
router.get('/category/:category', controller.listByCategory);

router.get('/', controller.listDeals);
router.get('/:id', controller.getById);
router.post('/:id/upvote', controller.upvote);
router.post('/:id/downvote', controller.downvote);
router.post('/:id/verify', controller.verify);

module.exports = router;
