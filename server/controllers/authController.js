const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const connection = require('../database');

const SECRET_KEY = process.env.SECRET_KEY;

// Transporter Nodemailer (avec Gmail par exemple)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// ✅ Demande de réinitialisation
exports.forgotPassword = (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email requis' });
  }

  connection.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) return res.status(500).json({ message: 'Erreur serveur', error: err });
    if (results.length === 0) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    const token = jwt.sign({ email }, SECRET_KEY, { expiresIn: '1h' });
    const resetLink = `${process.env.APP_URL}/client/reset.html?token=${token}`;


    // Envoi email
    transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Réinitialisation de mot de passe',
      html: `<p>Clique sur ce lien pour réinitialiser ton mot de passe :</p>
             <a href="${resetLink}">${resetLink}</a>`
    }, (mailErr, info) => {
      if (mailErr) return res.status(500).json({ message: 'Erreur envoi email', error: mailErr });
      res.json({ message: 'Email de réinitialisation envoyé !' });
    });
  });
};

// ✅ Réinitialisation mot de passe
exports.resetPassword = (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: 'Token et mot de passe requis' });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(400).json({ message: 'Token invalide ou expiré' });

    const email = decoded.email;
    const hashedPassword = bcrypt.hashSync(password, 10);

    connection.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email], (err2) => {
      if (err2) return res.status(500).json({ message: 'Erreur serveur', error: err2 });
      res.json({ message: 'Mot de passe réinitialisé avec succès !' });
    });
  });
};
