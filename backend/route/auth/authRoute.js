const router = require('express').Router();
const authController = require("../../controller/auth/authController");

const {authToken,validateUser, checkRole,getStatus}=require("../../middleware/authMiddleware.js");

// router.post('/createUser', authController.createUser);


router.post('/login' ,authController.login);
router.post('/logout',authToken,validateUser,authController.logout)
router.post('/resetPasswordrequest', authController.resetPasswordrequest);
// router.post('/resetPassword', authController.resetPassword);
router.post('/resetPassword/:id/:token', authController.resetPassword);

module.exports = router;