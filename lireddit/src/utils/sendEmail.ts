import nodemailer from "nodemailer";

// async..await is not allowed in global scope, must use a wrapper
export async function sendEmail(to: string, text: string) {
  // Generate test SMTP service account from ethereal.email

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "outlook",
    port: 587,
    secure: false, // true for 465, false for other ports
    service : 'outlook',
        auth: {
            user: 'sam.messengerbot@outlook.com',
            pass: 'mailbot362582'
        }
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"sam.messengerbot@outlook.com', // sender address
    to: to, // list of receivers
    subject: "Change password", // Subject line
    text, // plain text body
  });

  console.log("Message sent: %s", info.messageId);
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  // Preview only available when sending through an Ethereal account
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}