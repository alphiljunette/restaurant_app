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
    connection.query('SELECT * FROM users WHERE username = ?', [targetUsername], async (err, results) => {
        if (err) return res.status(500).json({ message: 'Erreur serveur', error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Utilisateur non trouvé' });

        try {
            // Générer un mot de passe temporaire aléatoire
            const newPassword = Math.random().toString(36).slice(-8);
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Mettre à jour en DB
            connection.query(
                'UPDATE users SET password = ? WHERE username = ?',
                [hashedPassword, targetUsername],
                async (err2) => {
                    if (err2) return res.status(500).json({ message: 'Erreur serveur', error: err2 });

                    // Envoyer un email uniquement à l’admin
                    await transporter.sendMail({
                        from: process.env.SMTP_USER,
                        to: 'alphiljunettem@gmail.com', // UNIQUEMENT admin
                        subject: 'Réinitialisation de mot de passe utilisateur',
                        html: `<p>Le mot de passe de l’utilisateur <b>${targetUsername}</b> a été réinitialisé.</p>
                               <p>Nouveau mot de passe : <b>${newPassword}</b></p>`
                    });

                    res.json({ message: `Mot de passe de ${targetUsername} réinitialisé et envoyé à l’admin` });
                }
            );
        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Erreur interne' });
        }
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


