const nodemailer=require("nodemailer");

const transport=nodemailer.createTransport({
    host:process.env.SENDGRID_HOST,
    port:process.env.SENDGRID_PORT,
    secure:true,
    auth:{
        user:process.env.SENDGRID_USERNAME,
        pass:process.env.SENDGRID_PASSWORD
    }
});

exports.sendMail=async(mailAlert)=>{

    try{
   const mailOptions={
    from:process.env.SENDER,
    to:mailAlert.email,
    subject:mailAlert.subject,
    html:mailAlert.message,
    attachments:mailAlert.attachments || []
   };

   transport.sendMail(mailOptions,function(error,info){
    if(error){
        console.log("error:", error);
    }
    else{
        console.log('Email sent'+ info.response);
    }
   });
    }
    catch(err){
    console.log(err);
    }
}