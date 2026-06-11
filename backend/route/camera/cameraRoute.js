const express = require('express');
const cameraController = require('../../controller/camera/cameraController');
const {
  authToken,
  checkRole,
  validateUser,
} = require('../../middleware/authMiddleware.js');
const router = express.Router();
router.post('/addCamera/:id',authToken,cameraController.addCamera)
module.exports = router;