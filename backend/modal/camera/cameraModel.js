const mongoose= require('mongoose');

 const cameraModel=  new mongoose.Schema({
userId: { type: mongoose.Schema.Types.ObjectId, ref: 'userModel', required: true },
    cameraLocations: [
  {
    location: { type: String, required: true },

    entryCamera: {
      
      rtspUrl: { type: String, required: true }
    },

    exitCamera: {
      
      rtspUrl: { type: String, required: true }
    }
  }
]

 })

 const camera= mongoose.model("Camera", cameraModel);
 module.exports=camera
