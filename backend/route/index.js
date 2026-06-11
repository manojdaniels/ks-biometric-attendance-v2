const router=require('express').Router();
const authRoutes=require('../route/auth/authRoute')
const attendanceRoute=require('../route/attendance/attendanceRoute')
const userRoute=require("../route/user/userRoute")
const imageRoute=require("../route/image/imageRoute")
const cameraRoute=require("../route/camera/cameraRoute")
router.use("/attendance",attendanceRoute)
router.use("/auth",authRoutes)
router.use("/user",userRoute)
router.use("/image",imageRoute)
router.use("/camera",cameraRoute)
router.use((req, res) => {
    console.warn(
      `404 Not found. Id: ${req.identifier} ${req.url} ${req.method} ${
        req.headers['user-agent']
      } ${JSON.stringify(req.body)}`,
      'warn'
    );
    return res.status(404).json({
      success: false,
      msg:"404 not found"
    });
  });
  module.exports=router