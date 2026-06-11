const User = require('../../modal/user/usermodal');
const Attendance = require('../../modal/attendance/attendanceModel');
const moment = require('moment-timezone');
const generateCSV = require('../../utils/csvGenerate');
const bcrypt = require('bcrypt');
const { Parser } = require('json2csv');
const {sendEmail}=require('../../utils/helper');

exports.getAllUser = async (req, res) => {
  try {
    // console.log("hii")
    const currentUser = req.user;
    // console.log(currentUser, "currentUser")
    // console.log(currentUser._id,"id of current e") // Assuming you have user data from auth middleware
   const { startDate, endDate, format } = req.query;  
  let dateQuery = {};

    if (startDate && endDate) {
      dateQuery.createdAt = {
        $gte: moment
          .tz(startDate, 'Asia/Kolkata')
          .startOf('day')
          .utc()
          .toDate(),
        $lte: moment.tz(endDate, 'Asia/Kolkata').endOf('day').utc().toDate(),
      };
    } else {
      dateQuery.createdAt = {
        $gte: moment
          .tz(Date.now(), 'Asia/Kolkata')
          .startOf('day')
          .utc()
          .toDate(),
        $lte: moment.tz(Date.now(), 'Asia/Kolkata').endOf('day').utc().toDate(),
      };
    }

    let userQuery = { role: { $ne: 'admin' } };

    if (currentUser.role === 'admin') {
      userQuery = {
        createdBy: currentUser._id,
        role: 'subadmin',
      };
    } else if (currentUser.role === 'subadmin') {
      userQuery = {
        createdBy: currentUser._id,
        role: 'user',
      };
    } else {
      userQuery = { _id: null };
    }

    const users = await User.find(userQuery).sort({ _id: -1 }).select("-password");

    const userIds = users.map((user) => user._id);
    const attendanceQuery = {
      ...dateQuery,
      userId: { $in: userIds },
    };

    const exitCounts = await Attendance.aggregate([
      { $match: attendanceQuery },
      {
        $group: {
          _id: '$userId',
          exitCount: { $sum: 1 },
        },
      },
    ]);

    const exitCountMap = exitCounts.reduce((acc, item) => {
      acc[item._id.toString()] = item.exitCount;
      return acc;
    }, {});

    const promise = users.map(async (user) => {
      const userAttendanceQuery = {
        ...dateQuery,
        userId: user._id,
      };

      const records = await Attendance.find(userAttendanceQuery).sort({
        entryTime: 1,
      });

      let totalWorkDuration = 0;

      // Pair entry/exit times to calculate duration
      for (let i = 0; i < records.length; i += 1) {
        const entryTime = records[i]?.entryTime;
        const exitTime = records[i]?.exitTime;

        if (entryTime && exitTime) {
          totalWorkDuration += new Date(exitTime) - new Date(entryTime);
        }
      }

      const totalWorkHours = (totalWorkDuration / (1000 * 60 * 60)).toFixed(2);

      return {
        ...user._doc,
        entryTIME:
          records.length > 0
            ? moment(records[0].entryTime).format('HH:mm:ss')
            : '--',
        exitTIME:
          records.length > 0 && records[records.length - 1].exitTime
            ? moment(records[records.length - 1].exitTime).format('HH:mm:ss')
            : '--',
        exitCount: exitCountMap[user._id.toString()] || 0,
        totalWorkHours: records.length > 0 ? totalWorkHours : '--',
      };
    });

   const data = await Promise.all(promise);

    if (format === 'csv') {
      const fields = [
        'name',
        'email',
        'phoneNumber',
        'entryTIME',
        'exitTIME',
        'exitCount',
        'totalWorkHours',
      ];
      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(data);

      res.header('Content-Type', 'text/csv');
      res.attachment('user_attendance.csv');

      return res.send(csv);
    }
    // return count;
    return res.status(200).json({
      message: 'All User Data fetch Successfully.',
      count: data.length,
      data,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }

};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById({ _id: req.params.id });

    if (!user) return res.status(401).json({ message: 'User not found' });

    if (user.role == 'admin') {
      return res.status(400).json({ message: 'Admin user cannot be delete.' });
    }

    const deleteUser2 = await User.findByIdAndDelete({ _id: user._id });
    return res.status(200).json({ message: 'User deleted Successfully' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.searchUser=async(req,res)=>{
  try{
 const{query}=req.query;
 if(!query){
  return res.status(400).json({message:"Search required"})
 }

 const escapedQuery= query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
 const searchRex=new RegExp(escapedQuery,"i");

 const result=await User.find({

  $or:[
    {name:searchRex},
    {email:searchRex}
  ]
 },
 
{
        name: 1,
        email: 1,
        role: 1,       // Include only necessary fields
        createdAt: 1,
        phoneNumber:1 || "--",
        entryTIME:1
      }
    )
    if (result.length === 0) {
      return res.status(401).json({ message: "No user found" });
    }

  return res.status(200).json({message:"Searching Successfull",result});
  }
  catch(err){
    res.status(500).json({message:err.message})
  }
}

// exports.getProfile=async(req,res)=>{
//   try{
//     const user =await User.findById(req.user.id).select("-password");

//     if(!user){
//       return res.status(404).json({message:"User Not Found"});
//     }
//     return res.json(user);

//   }catch(err){
//     return res.status(500).json({message:err.message})
//   }
// }

exports.getProfile = async (req, res) => {
  try {
 
    const userId = req.params?.id || req.user._id;

    const user = await User.findById(userId).select("-password")

    if (!user) {
      return res.status(404).json({ message: "User Not Found" });
    }

    return res.json(user);

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, address, phoneNumber, password } = req.body;

    if (!name || !email || !address || !phoneNumber || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { phoneNumber }],
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: 'User with this email or phone already exists' });
    }

    const roleHierarchy = {
      admin: 'subadmin',
      subadmin: 'user',
    };

    const creatorRole = req.user?.role;
    // console.log(req.user, 'user');
    const role = roleHierarchy[creatorRole];

    if (!role) {
      return res
        .status(403)
        .json({ message: "You don't have permission to create users" });
    }

    const newUser = await User.create({
      name,
      email,
      address,
      phoneNumber,
      password: password,
      role,
      createdBy: req.user._id,
    });

    // const mailData={
    //   to:email,
    //   subject:"Account Created Successfully",
    //   message: `<p>Hello ${name} , your account is created</p>
    //             <p> These are the credentials
    //              email:${email}</br>
    //               password:${password}
    //               </p>`,
    // };
    // await sendEmail(mailData)
    return res.status(201).json({
      name,
      email,
      address,
      phoneNumber,
      password: password,
      role,
      createdBy: req.user.name,
    });
  } catch (err) {
    // console.error('Error creating user:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};


exports.findUser=async(req,res)=>{
  try{
    const {id}=req.body
    if(!id){
      return res.status(404).json({message:"Id is required "})

    }

    const user =await User.findById(id).select("-password");

   if(!user){
    return res.status(404).json({message:"User not found"});
   }

   return res.status(200).json({message:"User found Successfully",user});
  }
  catch(err){
return res.status(500).json({message:err.message})
  }
}

exports.setUserActiveStatus = async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  if (typeof isActive !== 'boolean') {
    return res
      .status(400)
      .json({ message: 'Status must be a boolean (true or false).' });
  }

  if (!id) {
    return res.status(400).json({ message: 'User does not exist' });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.status(200).json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully.`,
      user: {
        id: updatedUser._id,
        isActive: updatedUser.isActive,
      },
    });
  } catch (error) {
    console.error('Error updating user active status:', error);

    return res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.addCamera=async(req, res)=>{
  try{
    const{id}=req.params
  const{ location, entryCamera, exitCamera}=req.body


   console.log(id,"id")
   console.log(location,"location")
   console.log("entry", entryCamera);
   console.log("exit", exitCamera)

    if(!id){
      return res.status(404).json({message:"ID not Found"})
    }

if(!location || !entryCamera?.rtspUrl|| !exitCamera.rtspUrl){
  return res.status(400).json({message:"Mising fields required "})
}

   const user= await User.findById(id);
   if(!user || user.role !== 'subadmin'){
    return res.status(403).json({message:"User not found"})
   }

   user.cameraLocations.push({location, entryCamera,exitCamera})

   await user.save()

   return res.status(200).json({message:"Camera Added Succefully",
    cameraLocations:user.cameraLocations})
  }
  catch(err){
  return res.status(500).json({message:err.message});
  }

}


exports.getUserCount=async(req,res)=>{
  try{
    console.log("hii")
   
 const{id}=req.params
 console.log(id,"id")
const userCount=await User.countDocuments({createdBy:id})
return res.status(200).json({message:"User Count fetched Successfully",userCount});        
  }

  catch(err){
    return res.status(500).json({message:err.message});
  }

}
