const mongoose=require('mongoose');

const attendanceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'userModel', required: true },
    userName: { type: String, required: true },  
    entryTime: { type: Date, required: true },
    exitTime: { type: Date },  
}, { timestamps: true });

const attendance = mongoose.model('attendance', attendanceSchema);
module.exports=attendance;