let socket;
let currentCategorieSlug = 'entrees';
const APP_URL_BACKEND = window.APP_URL_BACKEND;
// Vérification que toutes les fonctions sont définies
console.log('afficherPlats defined:', typeof afficherPlats);
console.log('initAdminPage defined:', typeof initAdminPage);
// -----------------------------
// Toast
// -----------------------------
function showToast(message, type = 'success') {
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    document.body.appendChild(toastContainer);

    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-bg-${type === 'success' ? 'success' : 'danger'} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    toastContainer.appendChild(toast);

    const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
    bsToast.show();

    toast.addEventListener('hidden.bs.toast', () => toastContainer.remove());
}

// -----------------------------
// Vérification token admin
// -----------------------------
window.addEventListener('load', () => {
    console.log("🔹 Page chargée");

    const token = localStorage.getItem('adminToken');
    console.log("Token récupéré:", token);

    if (!token) {
        console.warn("❌ Aucun token admin trouvé. Redirection vers login...");
        return redirectLogin();
    }

    try {
        const decoded = jwt_decode(token);
        console.log("Token décodé:", decoded);
        document.getElementById('user-name').textContent = decoded?.username || 'Utilisateur';
    } catch (err) {
        console.error("❌ Erreur décodage token:", err);
        localStorage.removeItem('adminToken');
        return redirectLogin();
    }

    initAdminPage();
});


function redirectLogin() {
    window.location.href = 'login.html?t=' + Date.now();
}
async function fetchPlats(categories) {
    console.log(`🔹 Récupération des plats pour la catégorie: ${categories}`);
    try {
        const res = await fetch(`${APP_URL_BACKEND}/api/plats/${categories}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
        });
        console.log("Status réponse fetchPlats:", res.status);
        if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
        const plats = await res.json();
        console.log("Plats reçus:", plats);
        afficherPlats(`${categories}-container`, plats);
    } catch (err) {
        console.error("❌ Erreur fetchPlats:", err);
    }
}



// -----------------------------
// Afficher les plats selon catégorie
// -----------------------------
async function afficherPlats(categories, plats = null) {
    const containerId = categories.includes('-container') ? categories : `${categories}-container`;
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '<p>Chargement...</p>';

    try {
        // Si plats déjà fournis → pas besoin de fetch
        if (!plats) {
            const res = await fetch(`${APP_URL_BACKEND}/api/plats/${categories}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
            });
            if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
            plats = await res.json();
        }

        container.innerHTML = '';
        if (plats.length === 0) {
            container.innerHTML = '<p>Aucun plat disponible</p>';
            return;
        }

        plats.forEach(plat => {
            const platDiv = document.createElement('div');
            platDiv.className = 'card mb-2';
            platDiv.innerHTML = `
                <div class="card-body">
                    <h5 class="card-title">${plat.nom}</h5>
                    <p class="card-text">${plat.description}</p>
                    <p><strong>Prix :</strong> ${plat.prix} Ar</p>
                    <button class="btn btn-sm btn-primary" onclick="editPlat(${plat.id}, '${categories}')">Modifier</button>
                    <button class="btn btn-sm btn-danger" onclick="deletePlat(${plat.id}, '${categories}')">Supprimer</button>
                </div>
            `;
            container.appendChild(platDiv);
        });
    } catch (err) {
        console.error(`Erreur chargement plats (${categories}):`, err);
        container.innerHTML = `<p class="text-danger">Erreur chargement plats</p>`;
        showToast(`Erreur chargement plats (${categories})`, 'error');
    }
}


// -----------------------------
// Initialisation page admin
// -----------------------------
function initAdminPage() {
    // fetchPlats('entrees');
    // fetchPlats('plats');
    // fetchPlats('desserts');
    // fetchPlats('boissons');
    // fetchPlats('plats-jour');

    document.documentElement.lang = 'fr';
    document.title = 'Gestion des Plats - Admin';

    ['entrees', 'plats', 'desserts', 'boissons', 'plats-jour'].forEach(categories => afficherPlats(categories));
    document.getElementById('view-orders').addEventListener('click', () => {
        loadCommandes();
        new bootstrap.Modal(document.getElementById('ordersModal')).show();
    });

    document.getElementById('view-history').addEventListener('click', () => {
        loadHistory();
        new bootstrap.Modal(document.getElementById('historyModal')).show();
    });

    document.getElementById('generate-qr-button').addEventListener('click', () => {
        new bootstrap.Modal(document.getElementById('qrcodeModal')).show();
        loadExistingQRCodes();
    });

    document.getElementById('logout').addEventListener('click', () => {
        localStorage.removeItem('adminToken');
        document.getElementById('user-name').textContent = '';
        redirectLogin();
    });

    document.getElementById('generate-qr').addEventListener('click', generateQRCodeHandler);

    initSocket(); // Tranche suivante gère socket.io
}
// -----------------------------
// Initialisation Socket.IO après token vérifié
// -----------------------------
function initSocket() {
    console.log("🔹 Initialisation Socket.IO avec URL:", APP_URL_BACKEND);
    socket = io(APP_URL_BACKEND, {
    auth: { token: localStorage.getItem('adminToken') || null }
    });


    socket.on('connect', () => {
        console.log("✅ Socket connecté. ID:", socket.id);
    });

    socket.on('connect_error', (err) => {
        console.error("❌ Erreur Socket.IO:", err.message);
    });

    // Exemple pour nouvelles commandes
    socket.on('order-ready', (data) => {
        console.log("📩 Nouvelle commande reçue:", data);
        showToast(`Nouvelle commande pour la table ${data.table_id}`);
        loadCommandes();
    });

    // Nouvelle commande prête
    // socket.on('order-ready', (data) => {
    //     showToast(`Nouvelle commande pour la table ${data.table_id}`);
    //     loadCommandes();
    // });

    // Rappel commande
    socket.on('order-ready-reminder', (data) => {
        showToast(`Rappel de commande pour la table ${data.table_id}`, 'warning');
        loadCommandes();
    });

    // Données client supprimées
    socket.on('client-data-deleted', ({ table_id }) => {
        showToast(`Données du client pour la table ${table_id} supprimées`, 'info');
    });

    // Plat mis à jour
    socket.on('platUpdated', (data) => {
        afficherPlats(data.categories);
    });

    // Statut commande mis à jour
    socket.on('commandeStatusUpdated', () => {
        loadCommandes();
    });
}

// -----------------------------
// Notifications avec commentaire
// -----------------------------
function showNotificationPrompt(commandeId, tableId) {
    const modalHtml = `
        <div class="modal fade" id="notifyModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Envoyer une notification</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <label for="notificationMessage" class="form-label">Message :</label>
                        <textarea class="form-control" id="notificationMessage" placeholder="Entrez votre message..." rows="3"></textarea>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                        <button type="button" class="btn btn-primary" id="sendNotificationBtn">Envoyer</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const notifyModalEl = document.getElementById('notifyModal');
    const bsModal = new bootstrap.Modal(notifyModalEl);
    bsModal.show();

    document.getElementById('sendNotificationBtn').onclick = async () => {
        const message = document.getElementById('notificationMessage').value.trim();
        if (!message) return showToast('Veuillez entrer un message', 'error');

        try {
            const res = await fetch(`${APP_URL_BACKEND}/api/notify-unavailable/${commandeId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({ message, table_id: tableId })
            });
            if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);

            showToast('Notification envoyée avec succès');
            bsModal.hide();
            notifyModalEl.remove();
        } catch (err) {
            console.error('Erreur envoi notification:', err);
            showToast('Erreur envoi notification', 'error');
        }
    };

    notifyModalEl.addEventListener('hidden.bs.modal', () => {
        notifyModalEl.remove();
    });
}

function notifyUnavailable(commandeId, tableId) {
    showNotificationPrompt(commandeId, tableId);
}

// -----------------------------
// Charger les QR codes existants
// -----------------------------
async function loadExistingQRCodes() {
    const tableBody = document.getElementById('qrcode-table-body');
    tableBody.innerHTML = '<tr><td colspan="3" class="text-center">Chargement...</td></tr>';
    
    try {
        const res = await fetch(`${APP_URL_BACKEND}/api/qrcodes`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
        });
        if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
        
        const qrCodes = await res.json();
        tableBody.innerHTML = '';
        if (qrCodes.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="3" class="text-center">Aucun QR code généré</td></tr>';
            return;
        }

        qrCodes.forEach(qr => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>Table ${qr.table_number}</td>
                <td><img src="${qr.qr_code_url}" alt="QR Code table ${qr.table_number}" style="width:100px; height:100px;"></td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="downloadQRCode('${qr.qr_code_url}', ${qr.table_number})">Télécharger</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteQRCode(${qr.id}, ${qr.table_number})">Supprimer</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (err) {
        console.error('Erreur chargement QR codes:', err);
        tableBody.innerHTML = '<tr><td colspan="3" class="text-center text-danger">Erreur de chargement</td></tr>';
        showToast('Erreur chargement QR codes', 'error');
    }
}

// -----------------------------
// Télécharger un QR code
// -----------------------------
function downloadQRCode(url, tableNumber) {
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-code-table-${tableNumber}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// -----------------------------
// Supprimer un QR code
// -----------------------------
async function deleteQRCode(id, tableNumber) {
    if (!confirm(`Supprimer QR code table ${tableNumber} ?`)) return;
    try {
        const res = await fetch(`${APP_URL_BACKEND}/api/qrcode/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
        });
        if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
        showToast('QR Code supprimé avec succès');
        loadExistingQRCodes();
    } catch (err) {
        console.error('Erreur suppression QR code:', err);
        showToast('Erreur suppression QR code', 'error');
    }
}

// -----------------------------
// Générer un QR code
// -----------------------------
async function generateQRCodeHandler() {
    const tableNumber = document.getElementById('table-number').value;
    if (!tableNumber) {
        showToast('Veuillez entrer un numéro de table', 'error');
        return;
    }
    try {
        const res = await fetch(`${APP_URL_BACKEND}/api/qrcode/${tableNumber}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
        });
        if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
        const data = await res.json();
        loadExistingQRCodes();
        const qrContainer = document.getElementById('qrcode-container');
        qrContainer.innerHTML = `<div class="alert alert-success">QR Code généré pour table ${tableNumber}</div><img src="${data.qrCode}" alt="QR Table ${tableNumber}" class="img-fluid" style="max-height:200px;">`;
        showToast('QR Code généré avec succès');
    } catch (err) {
        console.error('Erreur génération QR code:', err);
        showToast('Erreur génération QR code', 'error');
    }
}

// -----------------------------
// Charger les commandes pour le modal
// -----------------------------
async function loadCommandes() {
    const ordersList = document.getElementById('orders-list');
    ordersList.innerHTML = `<p>Chargement...</p>`;

    try {
        const res = await fetch(`${APP_URL_BACKEND}/api/commandes`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
        });
        if (!res.ok) {
            if (res.status === 401) {
                localStorage.removeItem('adminToken');
                document.getElementById('user-name').textContent = '';
                window.location.href = 'login.html?t=' + Date.now();
                return;
            }
            throw new Error(`Erreur HTTP ${res.status}`);
        }

        const commandes = await res.json();
        ordersList.innerHTML = '';

        if (commandes.length === 0) {
            ordersList.innerHTML = `<p>Aucune commande disponible</p>`;
            return;
        }

        commandes.forEach(commande => {
            let items = [];
            try {
                items = typeof commande.items === 'string' ? JSON.parse(commande.items) : commande.items;
            } catch (err) {
                console.error(`Erreur parsing items commande #${commande.id}:`, err);
                showToast(`Erreur lecture items commande #${commande.id}`, 'error');
            }

            let statusText = {
                'en attente': 'En attente',
                'en preparation': 'En préparation',
                'pret': 'Prêt',
                'servi': 'Servie'
            }[commande.status] || commande.status;

            const orderDiv = document.createElement('div');
            orderDiv.className = 'card mb-3';
            orderDiv.innerHTML = `
                <div class="card-body">
                    <h5 class="card-title">Commande #${commande.id} - Table ${commande.table_id}</h5>
                    <p><strong>Statut :</strong> ${statusText}</p>
                    <p><strong>Total :</strong> ${commande.total} Ar</p>
                    <p><strong>Date :</strong> ${new Date(commande.created_at).toLocaleString()}</p>
                    <p><strong>Items :</strong> ${items.length > 0 ? items.map(i => `${i.nom} x${i.quantity}`).join(', ') : 'Aucun item'}</p>
                    <div class="order-actions">
                        ${commande.status !== 'servi' ? `
                            <input type="checkbox" class="order-checkbox" data-id="${commande.id}">
                            <select class="form-select d-inline-block w-auto me-2" onchange="updateOrderStatus(${commande.id}, this.value)">
                                <option value="en attente" ${commande.status === 'en attente' ? 'selected' : ''}>En attente</option>
                                <option value="en preparation" ${commande.status === 'en preparation' ? 'selected' : ''}>En préparation</option>
                                <option value="pret" ${commande.status === 'pret' ? 'selected' : ''}>Prêt</option>
                                <option value="servi" ${commande.status === 'servi' ? 'selected' : ''}>Servi</option>
                            </select>
                            <button class="btn btn-sm btn-success" onclick="updateOrderStatus(${commande.id}, 'servi')">Commande marquée comme servie</button>
                            <button class="btn btn-sm btn-warning" onclick="notifyUnavailable(${commande.id}, '${commande.table_id}')">Envoyer notification</button>
                        ` : `<span class="badge bg-success">Servie</span>`}
                    </div>
                </div>
            `;
            ordersList.appendChild(orderDiv);
        });
    } catch (err) {
        console.error('Erreur chargement commandes:', err);
        ordersList.innerHTML = `<p class="text-danger">Erreur chargement commandes</p>`;
        showToast('Erreur chargement commandes', 'error');
    }
}

// -----------------------------
// Historique des commandes
// -----------------------------
async function loadHistory() {
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = `<p>Chargement...</p>`;

    try {
        const res = await fetch(`${APP_URL_BACKEND}/api/historique_commandes`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
        });
        if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);

        const commandes = await res.json();
        historyList.innerHTML = '';

        if (commandes.length === 0) {
            historyList.innerHTML = `<p>Aucune commande dans l'historique</p>`;
            return;
        }

        commandes.forEach(commande => {
            let items = [];
            try {
                items = typeof commande.items === 'string' ? JSON.parse(commande.items) : commande.items;
            } catch (err) {
                console.error(`Erreur parsing items commande #${commande.id}:`, err);
                showToast(`Erreur lecture items commande #${commande.id}`, 'error');
            }

            let statusText = {
                'non_livre': 'Non livrée',
                'livre': 'Livrée'
            }[commande.status_final] || commande.status_final;

            const historyDiv = document.createElement('div');
            historyDiv.className = 'card mb-3';
            historyDiv.innerHTML = `
                <div class="card-body">
                    <h5 class="card-title">Commande #${commande.id} - Table ${commande.table_id}</h5>
                    <p><strong>Statut :</strong> ${statusText}</p>
                    <p><strong>Total :</strong> ${commande.total} Ar</p>
                    <p><strong>Date :</strong> ${new Date(commande.created_at).toLocaleString()}</p>
                    <p><strong>Items :</strong> ${items.length > 0 ? items.map(i => `${i.nom} x${i.quantity}`).join(', ') : 'Aucun item'}</p>
                </div>
            `;
            historyList.appendChild(historyDiv);
        });
    } catch (err) {
        console.error('Erreur chargement historique:', err);
        historyList.innerHTML = `<p class="text-danger">Erreur chargement historique</p>`;
        showToast('Erreur chargement historique', 'error');
    }
}
// -----------------------------
// Mettre à jour le statut d'une commande
// -----------------------------
async function updateOrderStatus(commandeId, status) {
    try {
        const res = await fetch(`${APP_URL_BACKEND}/api/commande/${commandeId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({ status })
        });
        if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
        showToast('Statut de commande mis à jour');
        loadCommandes();
    } catch (err) {
        console.error('Erreur mise à jour commande:', err);
        showToast('Erreur mise à jour commande', 'error');
    }
}


// -----------------------------
// Supprimer un plat
// -----------------------------
async function deletePlat(id, categories) {
    if (!confirm(`Supprimer ce plat ?`)) return;
    try {
        const res = await fetch(`${APP_URL_BACKEND}/api/plats/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
        });
        if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
        showToast('Plat supprimé avec succès');
        afficherPlats(categories);
    } catch (err) {
        console.error('Erreur suppression plat:', err);
        showToast('Erreur suppression plat', 'error');
    }
}

// -----------------------------
// Modifier un plat (pré-remplir le formulaire)
// -----------------------------
function editPlat(id, categories) {
    // Récupérer le plat depuis le serveur ou le DOM
    fetch(`${APP_URL_BACKEND}/api/plats/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
    })
    .then(res => res.json())
    .then(plat => {
        document.getElementById('editId').value = plat.id;
        document.getElementById('editNom').value = plat.nom;
        document.getElementById('editDescription').value = plat.description;
        document.getElementById('editPrix').value = plat.prix;
        document.getElementById('editCategorie').value = categories;
        new bootstrap.Modal(document.getElementById('editPlatModal')).show();
    })
    .catch(err => {
        console.error('Erreur récupération plat:', err);
        showToast('Erreur récupération plat', 'error');
    });
}

// -----------------------------
// Sauvegarder modifications plat
// -----------------------------
document.getElementById('editPlatForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editId').value;
    const nom = document.getElementById('editNom').value.trim();
    const description = document.getElementById('editDescription').value.trim();
    const prix = parseFloat(document.getElementById('editPrix').value);
    const categories = document.getElementById('editCategorie').value;

    if (!nom || !description || isNaN(prix)) {
        showToast('Veuillez remplir tous les champs correctement', 'error');
        return;
    }

    try {
        const res = await fetch(`${APP_URL_BACKEND}/api/plats/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({ nom, description, prix, categories })
        });
        if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
        showToast('Plat mis à jour avec succès');
        new bootstrap.Modal(document.getElementById('editPlatModal')).hide();
        afficherPlats(categories);
    } catch (err) {
        console.error('Erreur mise à jour plat:', err);
        showToast('Erreur mise à jour plat', 'error');
    }
});

// -----------------------------
// Changer catégorie active
// -----------------------------
function changeCategorie(slug) {
    currentCategorieSlug = slug;
    ['entrees','plats','desserts','boissons','plats-jour'].forEach(c => {
        document.getElementById(`${c}-tab`).classList.remove('active');
        document.getElementById(`${c}-container`).classList.add('d-none');
    });
    document.getElementById(`${slug}-tab`).classList.add('active');
    document.getElementById(`${slug}-container`).classList.remove('d-none');
}
