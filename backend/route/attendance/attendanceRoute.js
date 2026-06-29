const express=require('express')
const attendaceController=require('../../controller/attendance/attendanceController')
const {authToken,checkRole,validateUser}=require("../../middleware/authMiddleware.js");
const router = express.Router();
router.post("/entryExit", attendaceController.entryExit);
router.get("/live", attendaceController.getLiveAttendance);
router.get("/reports/employees", authToken, validateUser, checkRole(["admin", "subadmin"]), attendaceController.getReportEmployees);
router.get("/reports", authToken, validateUser, checkRole(["admin", "subadmin"]), attendaceController.getAttendanceReport);
router.get("/getAttendance/:id",authToken,validateUser, checkRole(["admin"]),attendaceController.getAttendance)
// router.get("/getdailyData/:id",authToken,validateUser,checkRole(["admin"]), attendaceController.getdailyData)
module.exports=router;
