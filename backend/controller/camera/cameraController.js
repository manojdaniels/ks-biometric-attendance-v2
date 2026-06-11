// cameraController.js
const Camera = require('../../modal/camera/cameraModel');
const User = require('../../modal/user/usermodal');
const {publishData}=require('../../utils/mqtt')

exports.addCamera = async (req, res) => {
  try {
    const { location, entryCamera, exitCamera } = req.body;
    const { id } = req.params; // userId for whom camera is added

    console.log(location, "location");
    console.log(entryCamera, "entryCamera");
    console.log(exitCamera, "exitCamera");
    console.log(id, "userId ");

    if (!location || !entryCamera?.rtspUrl || !exitCamera?.rtspUrl) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Fetch target user
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Subadmin can only add camera for themselves
    if (req.user.role === "subadmin" && req.user.id !== id) {
      return res.status(403).json({ message: "Subadmin can only add camera for themselves" });
    }

    // Find or create camera document
    let cameraDoc = await Camera.findOne({ userId: targetUser._id });
    if (!cameraDoc) {
      cameraDoc = new Camera({ userId: targetUser._id, cameraLocations: [] });
    }

    // Add new camera
    cameraDoc.cameraLocations.push({ location, entryCamera, exitCamera });
    await cameraDoc.save();
    try {
      publishData({
        type: 'camera',
        // userId: targetUser._id,
        cameras: [
          { label: "entry", rtspUrl: entryCamera.rtspUrl },
          { label: "exit", rtspUrl: exitCamera.rtspUrl }
        ]
      });
    } catch (mqttErr) {
      console.error('MQTT publish error:', mqttErr);
      
    }

    return res.status(200).json({
      message: "Camera added successfully",
      cameraLocations: cameraDoc.cameraLocations
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
