// utils/sendEmail.js
const nodemailer = require('nodemailer');

// Initialize transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: process.env.EMAIL_USER, // kyasoso92@gmail.com
    pass: process.env.EMAIL_PASS, // Your App Password
  },
});

// Function to send emails
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"EthioAce" <${process.env.EMAIL_USER}>`, // e.g., "EthioAce" <kyasoso92@gmail.com>
      to,
      subject,
      text,
      html,
    });
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

module.exports = sendEmail;