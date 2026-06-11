const jwt = require('jsonwebtoken');
const User = require('../modal/user/usermodal');
const bcrypt = require("bcrypt");



exports.authToken = async (req, res, next) => {
  try {
   
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    
    let decoded;
    try {
      decoded = await jwt.verify(token, process.env.ACCESS_JWT_TOKEN);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          message: 'Token expired', 
          shouldRefresh: true 
        });
      }
      return res.status(401).json({ message: 'Invalid token' });
    }

    
    const user = await User.findById(decoded._id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    
    req.user = user;
    // console.log(user,"auth")
    // console.log(req.user,"request")
    next();

  } catch (err) {
    console.error("Auth error:", err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.validateUser = async(req, res, next) => {
  try {
      const apiKey = req.headers["x-api-key"];
      if (!apiKey) {
          return res.status(401).json({ message: "API key is required" });
      }

     
      const uniqueString = "attendance-" + process.env.SECRET_KEY;
      
      const isValid = await bcrypt.compare(uniqueString, apiKey);
      
      if (!isValid) {
          return res.status(401).json({ message: "Invalid API key" });
      }

      next();
  } catch(err) {
      return res.status(500).json({ message: err.message });
  }
};


exports.checkRole=(role)=> async(req,res,next)=>{
  
  try{
    // console.log(role);
    // console.log(req.user);
    // a.filter(x=>b.includes(x)).length > 0
    if(!role.filter(x=>req.user?.role.includes(x)).length > 0){
      return res.status(401).json({message:"You are not authorised"});
    }
    next();
  }
  catch(err){
 return  res.status(500).json({message:err.message});
  }
}




exports.getStatus= async(req,res,next)=>{
 const{id}=req.params;
 const {active}=req.body;


  try{
   const activeUser=await User.findById(id);

   if(!activeUser){
    return res.status(404).json({message:"User not found"})
   }
   if( activeUser.role === 'subadmin' && !activeUser.isActive){
    return res.ststus(403).json({messsage:"You are not authorised. Please contact to  your Admin"})
   }

   req.activeUser
   next();
  }
  catch(err){
  return res.status(500).json({message:err.message});
  }
}