const mongoose=require("mongoose")


const URI=process.env.MongoDB_URI;
const ConnectMongo = async() =>{
    try {
      await mongoose.connect(URI);
        console.log("connect to the mongodb");
    } catch (error) {
        if (error.name === 'MongooseServerSelectionError') {
            console.error('MongoDB connection failed. Check your internet connection and MongoDB Atlas Network Access IP allowlist.');
            console.error(error.message);
        } else {
            console.error(error);
        }
        throw error;
    }

}

module.exports=ConnectMongo;
