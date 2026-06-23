const User = require('../../modal/user/usermodal');
const Attendance = require('../../modal/attendance/attendanceModel');

exports.entryExit = async (req, res) => {
    try {

        const { type } = req.query;
        const { name, entry, exit } = req.body;

        const user = await User.findOne({ name });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        //-----------------------------------
        // ENTRY
        //-----------------------------------

        if (type === "entry") {

            const existing = await Attendance.findOne({
                userId: user._id,
                $or: [
                    { exitTime: null },
                    { exitTime: { $exists: false } }
                ]
            });

            if (existing) {
                return res.status(200).json({
                    message: "User already checked in"
                });
            }

            await Attendance.create({
                userId: user._id,
                userName: user.name,
                entryTime: entry
            });

            return res.status(200).json({
                message: "Entry recorded"
            });
        }

        //-----------------------------------
        // EXIT
        //-----------------------------------

        if (type === "exit") {

            const attendance = await Attendance.findOne({
                userId: user._id,
                $or: [
                    { exitTime: null },
                    { exitTime: { $exists: false } }
                ]
            }).sort({ entryTime: -1 });

            if (!attendance) {
                return res.status(400).json({
                    message: "No active attendance found"
                });
            }

            attendance.exitTime = exit;

            await attendance.save();

            return res.status(200).json({
                message: "Exit recorded"
            });
        }

        return res.status(400).json({
            message: "Invalid attendance type"
        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            message: err.message
        });
    }
};


exports.getAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, enddate } = req.query;
    let query = {};

    if (id) {
      query.userId = id;
    }
    if (startDate && enddate) {
      query.createdAt = { $gte: startDate, $lt: enddate };
    }
    const user2 = await Attendance.find(query).sort({ _id: -1 });
      // console.log(user2, 'user2');
    return res.status(200).json({ message: 'Data fetch successfully', user2 });
  
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
