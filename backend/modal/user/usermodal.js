const mongoose=require("mongoose");
const bcrypt=require("bcrypt");
const jwt=require("jsonwebtoken")


const userSchema= new mongoose.Schema({
    name:{type:String , required:true},
    email:{type:String, required:true, unique:true},
    address:{type:String, required:true},
    phoneNumber:{type:String, required:true, unique:true},
    password:{type:String, required:true},
    role:{
      type:String,
      enum:['admin','subadmin','user'],
      default:'user'
    },
isActive:{type:Boolean, default:true},
   
  //   profileImage:{type:String,default:""},
    datasetImages: {
    type: [String],
    default:[]
  },
   createdBy:{
    type:mongoose.Schema.Types.ObjectId, ref:"UserModel"
   }
});
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
      return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  });
  
  userSchema.methods.matchPassword = async function (password) {
    // console.log(password,this.password,"user password")
    return await bcrypt.compare(password, this.password);
  };
  
  userSchema.methods.getSignedJwtToken = function () {
    return jwt.sign(
      { _id: this._id, email: this.email },
      process.env.ACCESS_JWT_TOKEN,
      {
        expiresIn: process.env.ACCESS_EXPIRE
      }
    );
  };
  
  userSchema.methods.getSignedJwtRefreshToken = function () {
    this.refreshToken = jwt.sign(
      { _id: this._id, email: this.email },
      process.env.REFRESH_TOKEN,
      {
        expiresIn: process.env.REFRESH_EXPIRE,
      }
    );
    return this.refreshToken;
  };
  

  userSchema.methods.getApiKey = async function () {
    try {
        const bcrypt = require('bcrypt');
        const uniqueString = "attendance-" + process.env.SECRET_KEY;
        const salt = await bcrypt.genSalt(10);
        const apiKey = await bcrypt.hash(uniqueString, salt);
        // console.log(apiKey);
        return apiKey;

      
    } catch (error) {
        console.error("Error generating API key:", error);
        throw error;
    }

  
};
const userModel=  mongoose.model('userModel',userSchema);
module.exports=userModel