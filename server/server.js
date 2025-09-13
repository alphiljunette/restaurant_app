require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connection = require('./database');
const multer = require('multer');
const http = require('http');
const { Server } = require('socket.io');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const QRCode = require('qrcode');

const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});
const SECRET_KEY = process.env.SECRET_KEY;

// Dossiers uploads et QR codes
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
const qrCodesDir = path.join(uploadsDir, 'qrcodes');
if (!fs.existsSync(qrCodesDir)) fs.mkdirSync(qrCodesDir, { recursive: true });

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../client')));
app.use('/uploads', express.static(uploadsDir));

const authRoutes = require('./routes/authRoutes');
app.use('/api', authRoutes);

// Multer pour uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});
const upload = multer({ storage });

/* ------------------------ ROUTES UTILISATEURS ------------------------ */
// Inscription admin
app.post('/api/register', async (req, res) => {
    const { username, password, email } = req.body;
    if (!username || !password || !email) return res.status(400).json({ error: 'Champs manquants' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        connection.query(
            'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
            [username, hashedPassword, email],
            (err, result) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true, id: result.insertId });
            }
        );
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login admin
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Champs manquants' });

    connection.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(401).json({ error: 'Utilisateur non trouvé' });

        const user = results[0];
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ error: 'Mot de passe invalide' });

        const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '8h' });
        res.json({ token, username: user.username, id: user.id });
    });
});

// Middleware pour routes admin
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

/* ------------------------ ROUTES PLATS ------------------------ */
app.post('/api/plats', authenticateToken, upload.single('image'), (req, res) => {
    const { nom, description, prix, categorie } = req.body;
    const image = req.file ? req.file.filename : null;
    connection.query(
        'INSERT INTO plats (nom, description, prix, categorie, image) VALUES (?, ?, ?, ?, ?)',
        [nom, description, prix, categorie, image],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: result.insertId });
        }
    );
});

app.put('/api/plats/:id', authenticateToken, upload.single('image'), (req, res) => {
    const { id } = req.params;
    const { nom, description, prix, categorie } = req.body;
    const image = req.file ? req.file.filename : null;

    const query = image
        ? 'UPDATE plats SET nom=?, description=?, prix=?, categorie=?, image=? WHERE id=?'
        : 'UPDATE plats SET nom=?, description=?, prix=?, categorie=? WHERE id=?';
    const params = image
        ? [nom, description, prix, categorie, image, id]
        : [nom, description, prix, categorie, id];

    connection.query(query, params, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.delete('/api/plats/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    connection.query('DELETE FROM plats WHERE id=?', [id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.get('/api/plats', (req, res) => {
    connection.query('SELECT * FROM plats', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

/* ------------------------ ROUTES QR CODE ------------------------ */
app.get('/api/qrcode/:table', async (req, res) => {
    const tableId = req.params.table;
    const qrPath = path.join(qrCodesDir, `table-${tableId}.png`);

    if (fs.existsSync(qrPath)) {
        res.sendFile(qrPath);
    } else {
        try {
            await QRCode.toFile(qrPath, `http://localhost:${PORT}/client?table=${tableId}`);
            res.sendFile(qrPath);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
});
/* ------------------------ ROUTES COMMANDES ------------------------ */

// Création d’une commande (vérification token client avant insertion)
app.post('/api/commandes', async (req, res) => {
    const { plats, table_id, token } = req.body;

    if (!plats || plats.length === 0 || !table_id || !token) {
        return res.status(400).json({ error: 'Données manquantes' });
    }

    try {
        // Vérifier le token client
        const client = await new Promise((resolve, reject) => {
            jwt.verify(token, SECRET_KEY, (err, decoded) => {
                if (err) return reject(new Error("Token invalide ou expiré"));
                resolve(decoded);
            });
        });

        // Créer la commande
        connection.query(
            'INSERT INTO commandes (table_id, status) VALUES (?, "en attente")',
            [table_id],
            (err, result) => {
                if (err) return res.status(500).json({ error: err.message });
                const commandeId = result.insertId;

                // Insérer les plats associés
                plats.forEach(plat => {
                    connection.query(
                        'INSERT INTO commande_plats (commande_id, plat_id, quantite) VALUES (?, ?, ?)',
                        [commandeId, plat.id, plat.quantite]
                    );
                });

                // Créer une notification
                connection.query(
                    'INSERT INTO notifications (commande_id, table_id, message) VALUES (?, ?, ?)',
                    [commandeId, table_id, `Nouvelle commande pour la table ${table_id}`]
                );

                // Notifier les admins en temps réel
                io.emit('order-ready', { commandeId, table_id, plats });

                res.json({ success: true, commandeId });
            }
        );

    } catch (err) {
        return res.status(403).json({ error: err.message });
    }
});

// Récupération des commandes
app.get('/api/commandes', authenticateToken, (req, res) => {
    connection.query(
        'SELECT * FROM commandes ORDER BY created_at DESC',
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        }
    );
});

// Mise à jour du statut (ex: livrée)
app.put('/api/commandes/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    connection.query(
        'UPDATE commandes SET status=? WHERE id=?',
        [status, id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });

            if (status === 'livrée') {
                // Après livraison, suppression des données client liées
                connection.query('SELECT table_id FROM commandes WHERE id=?', [id], (err, results) => {
                    if (!err && results.length > 0) {
                        deleteClientData(results[0].table_id);
                    }
                });
            }

            res.json({ success: true });
        }
    );
});

/* ------------------------ NOTIFICATIONS ------------------------ */
app.get('/api/notifications', authenticateToken, (req, res) => {
    connection.query(
        'SELECT * FROM notifications ORDER BY created_at DESC',
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        }
    );
});

/* ------------------------ SUPPRESSION DONNÉES CLIENT ------------------------ */
function deleteClientData(tableId) {
    // Supprimer les notifications associées
    connection.query('DELETE FROM notifications WHERE table_id=?', [tableId], (err) => {
        if (err) console.error('Erreur suppression notifications:', err.message);
    });

    // Supprimer les commandes associées
    connection.query('DELETE FROM commandes WHERE table_id=?', [tableId], (err) => {
        if (err) console.error('Erreur suppression commandes:', err.message);
    });

    console.log(`Toutes les données du client (table ${tableId}) ont été supprimées`);
}
/* ------------------------ SOCKET.IO ------------------------ */
io.on('connection', (socket) => {
    console.log('Nouveau client connecté');

    // Écoute des commandes en temps réel
    socket.on('new-order', (data) => {
        io.emit('order-ready', data);
    });

    // Gestion des rappels de commande
    socket.on('order-reminder', ({ commandeId, table_id }) => {
        connection.query(
            'SELECT * FROM notifications WHERE commande_id=? ORDER BY created_at DESC LIMIT 1',
            [commandeId],
            (err, results) => {
                if (err) return console.error(err.message);
                if (results.length === 0) return;

                let notif = results[0];
                let reminderCount = notif.reminder_count || 0;
                reminderCount++;

                // Mettre à jour compteur rappel
                connection.query(
                    'UPDATE notifications SET reminder_count=? WHERE id=?',
                    [reminderCount, notif.id],
                    (err) => {
                        if (err) return console.error(err.message);

                        if (reminderCount >= 3) {
                            // Après le 3ème rappel, suppression des données client
                            deleteClientData(table_id);
                            io.emit('client-data-deleted', { table_id });
                        } else {
                            io.emit('order-ready-reminder', { commandeId, table_id });
                        }
                    }
                );
            }
        );
    });

    socket.on('disconnect', () => {
        console.log('Client déconnecté');
    });
});

/* ------------------------ DEMARRAGE SERVEUR ------------------------ */
server.listen(PORT, () => {
    console.log(`Serveur en écoute sur http://localhost:${PORT}`);
});
