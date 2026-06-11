const User=require("../modal/user/usermodal");

exports.adminCreated=async()=>{
    try{
 const findRole= await User.findOne({role:"admin"});
//  console.log(findRole);
 if(!findRole)
    {
    
    const admin= new User({
        name:process.env.ADMIN_NAME,
        email:process.env.EMAIL,   // xyz@gmail.com;
        password:process.env.PASSWORD, // 123456789
        phoneNumber:process.env.PHONENUMBER,//7300758082
        role:"admin" //admin

    })
    // console.log(admin)
    await admin.save(); // admin save
    console.log("Admin Created Successfully"); // message admin  created
    return ; 
 }
  console.log("Admin Already Exists");
 return; 
    }
    catch(err){
     console.error("Admin not created");
    }
}