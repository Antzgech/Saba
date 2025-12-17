const express = require('express');
const router = express.Router();
const {
  createChannel,
  updateChannel,
  deleteChannel,
  getAllChannels,
  getAllUsers,
  updateUser,
  getAdminStats,
  getRewards,
  updateRewardStatus
} = require('../controllers/adminController');
const { auth, adminAuth } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

// All admin routes require authentication and admin privileges
router.use(auth, adminAuth);

// Channel management
router.post('/channels', validate(schemas.createChannel), createChannel);
router.put('/channels/:id', validate(schemas.updateChannel), updateChannel);
router.delete('/channels/:id', deleteChannel);
router.get('/channels', getAllChannels);

// User management
router.get('/users', getAllUsers);
router.put('/users/:id', updateUser);

// Statistics
router.get('/stats', getAdminStats);

// Reward management
router.get('/rewards', getRewards);
router.put('/rewards/:id/status', updateRewardStatus);

module.exports = router;
