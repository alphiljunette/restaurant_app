const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const connection = require('../database');

const SECRET_KEY = process.env.SECRET_KEY;

// Transporteur Nodemailer
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false, // TLS
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Demande de réinitialisation par admin
exports.adminResetPassword = (req, res) => {
    const { adminEmail, targetUsername } = req.body;

    if (adminEmail !== 'alphiljunettem@gmail.com') {
        return res.status(403).json({ message: 'Non autorisé : seul l’admin peut réinitialiser un mot de passe' });
    }

    connection.query('SELECT * FROM users WHERE username = ?', [targetUsername], (err, results) => {
        if (err) return res.status(500).json({ message: 'Erreur serveur', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Utilisateur non trouvé' });

        const token = jwt.sign({ email: results[0].email }, SECRET_KEY, { expiresIn: '1h' });
        const resetLink = `${process.env.APP_URL_FRONTEND}/login.html?token=${token}`;

        transporter.sendMail({
            from: process.env.SMTP_USER,
            to: adminEmail, // ou results[0].email si tu veux que le lien soit envoyé directement à l’utilisateur
            subject: 'Réinitialisation de mot de passe',
            html: `<p>Cliquez sur ce lien pour réinitialiser le mot de passe :</p>
                  <a href="${resetLink}">${resetLink}</a>`
        }, (mailErr) => {
            if (mailErr) return res.status(500).json({ message: 'Erreur envoi email', error: mailErr });
            res.json({ message: `Lien de réinitialisation envoyé pour ${targetUsername}` });
        });
    });

};



// Réinitialisation mot de passe
exports.resetPassword = (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: 'Token et mot de passe requis' });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(400).json({ message: 'Token invalide ou expiré' });

        const targetEmail = decoded.email; // compte à modifier
        const hashedPassword = bcrypt.hashSync(password, 10);

        connection.query(
            'UPDATE users SET password = ? WHERE email = ?',
            [hashedPassword, targetEmail],
            (err2) => {
                if (err2) return res.status(500).json({ message: 'Erreur serveur', error: err2 });
                console.log(`Mot de passe réinitialisé pour : ${targetEmail}`);
                res.json({ message: `Mot de passe réinitialisé pour ${targetEmail}` });
            }
        );
    });
};


