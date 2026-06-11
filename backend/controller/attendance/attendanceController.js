const User = require('../../modal/user/usermodal');
const Attendance = require('../../modal/attendance/attendanceModel');
// const moment = require('moment-timezone');
exports.entryExit = async (req, res) => {
  try {
    const { type } = req.query;
    const { name, entry, exit } = req.body;
    const user = await User.findOne({ name: name });
    if (!user) return res.status(400).json({ message: 'User not found' });
    if (type == 'entry') {
      const entry1 = await Attendance.create({
        userId: user._id,
        userName: user.name,
        entryTime: entry,
      });
      // console.log(entry1, 'user1');
    } else {
      const user1 = await Attendance.findOne({
        userId: user._id,
      }).sort({ _id: -1 });
      const entry2 = await Attendance.findOneAndUpdate(
        {
          _id: user1._id,
        },
        { $set: { exitTime: exit } },
        { new: true, runValidators: true }
      );
// console.log(entry2, 'user')
    }
    
    return res.status(200).json({ message: ' Data Successfully inserted' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
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

// exports.getdailyData = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { startDate, endDate } = req.query;
//     let query = { userId: id };

//     if (startDate && endDate) {
//       query.createdAt = {
//         $gte: moment
//           .tz(startDate, 'Asia/kolkata')
//           .startOf('day')
//           .utc()
//           .toDate(),
//         $lte: moment.tz(endDate, 'Asia/Kolkata').endOf('day').utc().toDate(),
//       };
//     } else {
//       query.createdAt = {
//         $gte: moment
//           .tz(new Date(), 'Asia/kolkata')
//           .startOf('day')
//           .utc()
//           .toDate(),
//         $lte: moment.tz(new Date(), 'Asia/Kolkata').endOf('day').utc().toDate(),
//       };

      
//     }

//     const entry = await Attendance.find(query).sort({ _id: 1 }).limit(1);
//     const exit = await Attendance.find(query).sort({ _id: -1 }).limit(1);

//     return res.status(200).json({message:"First Entry and Last Exit",entry,exit})
//   } catch (err) {
//     return res.status(500).json({ message: err.message });
//   }
// };
