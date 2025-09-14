const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const connection = require('../database');

const SECRET_KEY = process.env.SECRET_KEY;

// Transporteur Nodemailer
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Demande de réinitialisation par admin
exports.adminResetPassword = (req, res) => {
    const { targetUsername } = req.body;

    if (!targetUsername) {
        return res.status(400).json({ message: 'Le nom utilisateur est requis' });
    }

    // Vérifier si l’utilisateur existe
    connection.query('SELECT * FROM users WHERE username = ?', [targetUsername], (err, results) => {
        if (err) return res.status(500).json({ message: 'Erreur serveur', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Utilisateur non trouvé' });

        // Créer un token JWT avec email ou username
        const token = jwt.sign({ username: targetUsername }, SECRET_KEY, { expiresIn: '1h' });

        // Lien de réinitialisation
        const resetLink = `${process.env.APP_URL_FRONTEND}/login.html?token=${token}`;

        // Envoyer le lien UNIQUEMENT à l’admin
        transporter.sendMail({
            from: process.env.SMTP_USER,
            to: 'alphiljunettem@gmail.com',
            subject: `Réinitialisation mot de passe pour ${targetUsername}`,
            html: `<p>L’utilisateur <b>${targetUsername}</b> a demandé une réinitialisation de mot de passe.</p>
                   <p>Cliquez sur ce lien pour définir un nouveau mot de passe :</p>
                   <a href="${resetLink}">${resetLink}</a>`
        }, (mailErr) => {
            if (mailErr) return res.status(500).json({ message: 'Erreur envoi email', error: mailErr });
            res.json({ message: `Lien de réinitialisation envoyé à l’admin pour ${targetUsername}` });
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


