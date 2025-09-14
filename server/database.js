
const mysql = require('mysql2');

const connection = mysql.createPool({
    host: 'gateway01.ap-northeast-1.prod.aws.tidbcloud.com',
    user: '34e6g2nn2M23th7.root',
    password: 'EWWgrm13GzD4gSGi', // ⚠️ Mets le mot de passe généré dans TiDB
    database: 'restaurant_db',
    port: 4000,
    ssl: {
        rejectUnauthorized: true
    },
    waitForConnections: true,
    connectionLimit: 10, // nombre max de connexions simultanées
    queueLimit: 0        // pas de limite dans la file d’attente
});

console.log("⏳ Tentative de connexion à TiDB Cloud...");
connection.getConnection((error, conn) => {
    if (error) {
        console.error('❌ Erreur de connexion MySQL (TiDB Cloud):', error.message);
        console.error('Code erreur:', error.code);
        console.error('Détails:', error);
        console.log('💡 Astuces:');
        console.log('1. Vérifie que tu as bien généré un mot de passe dans TiDB Cloud');
        console.log('2. Vérifie que ton IP actuelle est autorisée dans TiDB Cloud');
        console.log('3. Vérifie que le port est bien 4000 et non 3306');
    } else {
        console.log('✅ Connecté à TiDB Cloud (MySQL) !');
        conn.release(); // libère la connexion test
    }
});

module.exports = connection;
