const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '2003',
    database: 'restaurant_db',
    port: 3307, // Essayez 3306 si 3307 ne fonctionne pas
    // insecureAuth: true // Commentez cette ligne pour tester
});

connection.connect((error) => {
    if (error) {
        console.error('❌ Erreur de connexion MySQL:', error.message);
        console.error('Code erreur:', error.code);
        console.error('Détails:', error);
        console.log('💡 Astuces:');
        console.log('1. Vérifiez que MySQL est démarré');
        console.log('2. Vérifiez votre mot de passe MySQL');
        console.log('3. Essayez avec password: "" (vide)');
        console.log('4. Vérifiez le port MySQL (3306 ou 3307)');
        console.log('5. Assurez-vous que la base restaurant_db existe');
    } else {
        console.log('✅ Connecté à la base de données MySQL!');
    }
});

module.exports = connection;