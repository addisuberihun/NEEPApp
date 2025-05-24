const express = require('express');
const router = express.Router();
const {
  requestPasswordReset,
  verifyResetToken,
  resetPassword,
} = require('../controller/forgotPasswordController');

// Debug: Log imported functions
console.log({ requestPasswordReset, verifyResetToken, resetPassword });

router.post('/request', requestPasswordReset);
router.get('/verify/:token', verifyResetToken);
router.post('/reset/:token', resetPassword);

module.exports = router;