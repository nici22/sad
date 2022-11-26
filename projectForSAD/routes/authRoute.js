const express = require('express');
const { login, register, logout, generateAccessToken, sendResetPassword, verifyUrl, resetPassword } = require('../controllers/authController');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh_token', generateAccessToken);
router.post('/password_reset', sendResetPassword);
router.get('/password_reset/:id/:token', verifyUrl);
router.post('/password_reset/:id/:token', resetPassword);


module.exports = router;