require("dotenv").config()
const express=require("express")
const cors=require("cors")
// const multer=require("multer")
const path=require("path")
const morgan=require("morgan")
const helmet=require("helmet")
const http=require("http")
const mqtt= require('./utils/mqtt')
const package=require("./package.json")
const {rateLimit}= require("express-rate-limit")
const cookieParser=require("cookie-parser")
const bodyParser=require("body-parser")
const connectDb=require("./config/db")
const port=process.env.PORT || 8001
 const app=express()
 const server=http.createServer(app)
 const routing=require('./route/index.js')
 const {adminCreated}=require('./utils/onServerStart')
// server middleware
app.use(express.json())
app.use(bodyParser.json());
app.use(bodyParser.text({ type: 'text/plain' }));
app.use(cookieParser());

app.use(cors('*'));
app.use(helmet());
app.use(morgan('dev'));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
);

( async()=>{
      await adminCreated()
}
)()
  
// }
app.use('/health', (req, res) => {
    res.status(200).send({
      version: package.version,
      status: 'UP',
      msg: 'The API is up and running!',
    });
  });
  app.use('/api',routing);
  connectDb()
  .then(()=>{
    server.listen(port,()=>{console.log(`server is running at ${port}`)})

  })
  .catch((err)=>{
    console.log(`Error in Db connection ${err.message}`)
  })