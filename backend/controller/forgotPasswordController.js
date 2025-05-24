const crypto = require('crypto');
const nodemailer = require('nodemailer');
const StudentModel = require('../model/signupUserModel');

const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    const student = await StudentModel.findOne({ email });
    if (!student) {
      return res.status(404).json({ message: 'Email not found' });
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    student.resetPasswordToken = token;
    student.resetPasswordExpires = Date.now() + 3600000; // 1 hour expiry
    await student.save();

    // Configure email transport with explicit host and port
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // Use TLS
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
      }
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    const mailOptions = {
      to: student.email,
      from: process.env.EMAIL_USER,
      subject: 'Password Reset Request',
      text: `You requested a password reset. Click the link below to reset your password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Failed to process request', error: error.message });
  }
};

const verifyResetToken = async (req, res) => {
  const { token } = req.params;

  try {
    const student = await StudentModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!student) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    res.status(200).json({ message: 'Token is valid' });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ message: 'Failed to verify token', error: error.message });
  }
};

const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const student = await StudentModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!student) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    // Update password and clear reset fields
    student.password = password;
    student.resetPasswordToken = null;
    student.resetPasswordExpires = null;
    await student.save();

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Failed to reset password', error: error.message });
  }
};

console.log({ requestPasswordReset, verifyResetToken, resetPassword });
module.exports = {
  requestPasswordReset,
  verifyResetToken,
  resetPassword,
};