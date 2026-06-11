const User = require('../../modal/user/usermodal');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { sendMail } = require('../../utils/helper');
// exports.createUser = async (req, res,) => {
//   try {
//     const { name, email, phoneNumber, password } = req.body;

//     //  check if user exist

//     const exist = await User.findOne({ email });
//     if (exist) return res.status(400).json({ message: 'User already exist' });

//     const newUser = new User({
//       name,
//       email,
//       password: password,
//       phoneNumber
      
//     });
//     await newUser.save();
//     res.status(200).json({ message: 'User Created Successfully' });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User does not exist' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch)
      return res.status(400).json({ message: 'Invalid Credentials' });

    const token = user.getSignedJwtToken();
    const apikey = user.getApiKey();
    const refreshToken = user.getSignedJwtRefreshToken();
    res
      .cookie('jwt', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      }).cookie('apikey', apikey, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      });
    return res.status(200).json({ message: 'Login Successfully', token, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    res.clearCookie('refreshToken', { secure: true, httpOnly: true });

    res.clearCookie('apikey', { secure: true, httpOnly: true });
    return res.status(200).json({ message: 'Logout Successfully' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.resetPasswordrequest= async(req,res)=>{
   const{email}=req.body;
  //  console.log(email,"email")
  try{
 

  const user=await User.findOne({email});
  if(!user){
    return res.status(400).json({message:"User Not Found"});
  }

  // const resetToken = process.env.ACCESS_JWT_TOKEN;
  const isRequest=jwt.sign({id:user._id, email:user.email},process.env.ACCESS_JWT_TOKEN,{expiresIn:"10m"})
  
  const requestURL = `${process.env.CLIENT_URL}/reset-password/${user._id}/${isRequest}`;
  const mailData = {
      email: user.email,
      subject: "Password Reset Request",
      message: `<p>Hello ${user.name || "User"},</p>
                <p>Click the link below to reset your password:</p>
                <a href="${requestURL}">Reset Link</a>
                <p>This link will expire in 10 minutes.</p>`,
    };
    // console.log(mailData,"mailData")

    await sendMail(mailData);

    return res.status(200).json({ message: "Password reset link sent to your email." });
  
}
  catch(err){
return res.status(500).json({ message: "Something went wrong." });
  }

}

// exports.resetPassword = async (req, res, next) => {
//   const { id, token } = req.params;
//   const { password } = req.body;

//   try {
//     const user = await User.findOne({ _id: id });
//     if (!user) {
//       return res.status(400).json({ message: "User not exists!" });
//     }

//     const secret = process.env.JWT + user.password;



//     const verify = jwt.verify(token, secret);
//     const encryptedPassword = await bcrypt.hash(password, 10);
//     await User.updateOne(
//       {
//         _id: id,
//       },
//       {
//         $set: {
//           password: encryptedPassword,
//         },
//       }
//     );


//     res.status(200).json({ message: 'Password has been reset' });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: 'Something went wrong' });
//   }
// };


exports.resetPassword = async (req, res) => {
  const {id, token } = req.params;
  // console.log(id,"id ");
  // console.log("")
  // console.log(token,"token");
  const password = req.body.password; // Ensure lowercase
  // console.log(password, "password");

  // Add parameter validation
  if (!id || !token || !password) {
    return res.status(400).json({ message: "Missing parameters" });
  }

  try {
    const user = await User.findById(id);
    if (!user) return res.status(400).json({ message: "User not exists!" });

    // Verify token and match to user
    const verify = jwt.verify(token, process.env.ACCESS_JWT_TOKEN);
    if (verify.id !== user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

  
    const salt = await bcrypt.genSalt(10);
    const encryptedPassword = await bcrypt.hash(password, salt);
    await User.updateOne({ _id: id }, { password: encryptedPassword });
    
    return res.status(200).json({ message: 'Password has been reset' });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    console.error("Password Reset Error:", error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};