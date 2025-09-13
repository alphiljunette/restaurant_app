const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Route pour que l’admin demande la réinitialisation d’un mot de passe
router.post('/admin-reset-password', authController.adminResetPassword);

// Route pour que l’utilisateur final réinitialise son mot de passe via le token
router.post('/reset-password', authController.resetPassword);

module.exports = router;
