const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Route mot de passe oublié
router.post('/forgot-password', authController.forgotPassword);

// Route réinitialisation mot de passe
router.post('/reset-password', authController.resetPassword);

module.exports = router;
