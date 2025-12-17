const express = require('express');
const router = express.Router();
const {
  getChannels,
  verifySubscription,
  handleUnsubscribe,
  getSubscriptionStatus
} = require('../controllers/socialController');
const { auth, optionalAuth } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

router.get('/channels', optionalAuth, getChannels);
router.post('/verify', auth, validate(schemas.verifySubscription), verifySubscription);
router.post('/unsubscribe', auth, handleUnsubscribe);
router.get('/status', auth, getSubscriptionStatus);

module.exports = router;
