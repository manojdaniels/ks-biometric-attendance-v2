
const express=require('express');
const router= express.Router();
const upload=require("../../middleware/multerMiddleware");
const {publishData}=require('../../utils/mqtt')
const {authToken}= require('../../middleware/authMiddleware')

router.post('/upload', authToken,upload.array('images',25),(req,res)=>{
      if(!req.files || req.files.length < 1){
        return res.status(400).json({message:"image required "})

      }
      const uploadPath = req.files[0].destination; 
  const personName=req.cleanedName;
  console.log(personName);
        publishData({
          type: "train",
          userId: req.user.id,
          personName,
     uploadPath,
          // totalImages: req.files.length

        })

       res.send(`Upload Successfull with ${req.files.length} images`);
})

module.exports=router