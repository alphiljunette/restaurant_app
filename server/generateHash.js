// generateHash.js
const bcrypt = require('bcryptjs');

// Remplace 'TonMotDePasse123' par le mot de passe que tu veux pour cet utilisateur
const password = 'junette';

// Génère le mot de passe haché
const hashedPassword = bcrypt.hashSync(password, 10);

console.log('Mot de passe haché :', hashedPassword);
