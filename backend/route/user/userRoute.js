const express = require('express');
const userController = require('../../controller/userController/userController.js');
const {
  authToken,
  checkRole,
  validateUser,
} = require('../../middleware/authMiddleware.js');
const router = express.Router();
router.get(
  '/getAllUser',
authToken,
  validateUser,
  checkRole(['admin']),
  userController.getAllUser
);
router.delete(
  '/deleteUser/:id',
  authToken,
  validateUser,
  checkRole(['admin']),
  userController.deleteUser
);

// router.get('/getProfile/:id?',userController.getProfile);

router.get('/getProfile/:id?', userController.getProfile);

// router.get(
//   '/searchUser',
//   authToken,
//   validateUser,
//   checkRole(['admin']),
//   userController.searchUser
// );


router.get('/findUser',authToken,userController.findUser)
router.post('/createUser',authToken,userController.createUser);
router.get('/getProfile',authToken,userController.getProfile)
router.patch('/status/:id',userController.setUserActiveStatus)
router.get('/userCount/:id',authToken,userController.getUserCount)
module.exports = router;
