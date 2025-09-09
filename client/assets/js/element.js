const socket = io('https://restaurant-api-d4x5.onrender.com', {
  auth: {
    token: localStorage.getItem('token') || null
  }
});

let cart = [];
let activeCard = null;

// Translation data
const translations = {
  fr: {
    'page-title': 'Menu Restaurant',
    'category-entrees': 'Entrées',
    'category-plats': 'Plats',
    'category-desserts': 'Desserts',
    'category-boissons': 'Boissons',
    'category-plats-jour': 'Plat du jour',
    'restaurant-name': 'Chez Miora',
    'menu-title': 'Le Menu',
    'connection-status-disconnected': 'Déconnecté',
    'connection-status-connected': 'Connecté',
    'cart-title': 'Votre Panier',
    'table-number-label': 'Numéro de table',
    'cart-total': 'Total: 0 Ar',
    'send-order': 'Envoyer la commande',
    'rang-title': 'Votre Position',
    'rang-table-number-label': 'Numéro de table',
    'check-rang': 'Vérifier',
    'no-items': 'Aucun plat dans cette catégorie',
    'error-loading-plats': 'Erreur chargement plats',
    'cart-empty': 'Votre panier actuel est vide.',
    'past-orders': 'Commandes passées',
    'table-number-error': 'Veuillez entrer votre numéro de table !',
    'cart-empty-error': 'Panier vide',
    'order-sent': 'Commande envoyée !',
    'order-error': 'Erreur: Envoi de la commande échoué',
    'connection-error': 'Erreur de connexion au serveur',
    'add-to-cart-error': 'Erreur lors de l\'ajout au panier',
    'add-to-cart-success': 'Plat ajouté au panier !',
    'table-number-required': 'Entrez numéro de table',
    'loading': 'Chargement...',
    'no-active-order': 'Aucune commande active pour cette table.',
    'status-pending': 'En attente',
    'status-preparing': 'En préparation',
    'status-ready': 'Prêt',
    'status-label': 'Statut',
    'position-label': 'Position',
    'total-label': 'Total',
    'time-label': 'Heure',
    'loading-notifications': 'Chargement des notifications...',
    'no-notifications': 'Aucune notification.',
    'error-loading-rang': 'Erreur lors du chargement du rang',
    'order-ready': 'Votre commande pour la table {table_id} est prête !',
    'order-ready-reminder': 'Rappel : Votre commande pour la table {table_id} est prête !',
    'notification': 'Notification: {message}',
    'error-checking-order': 'Erreur lors de la vérification de la commande',
    'item-unavailable': 'Plat indisponible',
    'order-non-livre': 'Commande non livrée pour la table {table_id}',
    'order-livre': 'Commande livrée pour la table {table_id}'
  },
  en: {
    'page-title': 'Restaurant Menu',
    'category-entrees': 'Starters',
    'category-plats': 'Main Courses',
    'category-desserts': 'Desserts',
    'category-boissons': 'Drinks',
    'category-plats-jour': 'Daily Special',
    'restaurant-name': 'Chez Miora',
    'menu-title': 'Menu',
    'connection-status-disconnected': 'Disconnected',
    'connection-status-connected': 'Connected',
    'cart-title': 'Your Cart',
    'table-number-label': 'Table Number',
    'cart-total': 'Total: 0 Ar',
    'send-order': 'Send Order',
    'rang-title': 'Your Position',
    'rang-table-number-label': 'Table Number',
    'check-rang': 'Check',
    'no-items': 'No items in this category',
    'error-loading-plats': 'Error loading items',
    'cart-empty': 'Your current cart is empty.',
    'past-orders': 'Past Orders',
    'table-number-error': 'Please enter your table number!',
    'cart-empty-error': 'Cart is empty',
    'order-sent': 'Order sent!',
    'order-error': 'Error: Failed to send order',
    'connection-error': 'Server connection error',
    'add-to-cart-error': 'Error adding to cart',
    'add-to-cart-success': 'Item added to cart!',
    'table-number-required': 'Enter table number',
    'loading': 'Loading...',
    'no-active-order': 'No active order for this table.',
    'status-pending': 'Pending',
    'status-preparing': 'Preparing',
    'status-ready': 'Ready',
    'status-label': 'Status',
    'position-label': 'Position',
    'total-label': 'Total',
    'time-label': 'Time',
    'loading-notifications': 'Loading notifications...',
    'no-notifications': 'No notifications.',
    'error-loading-rang': 'Error loading position',
    'order-ready': 'Your order for table {table_id} is ready!',
    'order-ready-reminder': 'Reminder: Your order for table {table_id} is ready!',
    'notification': 'Notification: {message}',
    'error-checking-order': 'Error checking order',
    'item-unavailable': 'Item unavailable',
    'order-non-livre': 'Order not delivered for table {table_id}',
    'order-livre': 'Order delivered for table {table_id}'
  }
};
// Map server messages to translation keys
function mapServerMessageToTranslationKey(message) {
  const messageMap = {
    'item-unavailable': 'item-unavailable',
    'order-ready': 'order-ready',
    'order-ready-reminder': 'order-ready-reminder',
    'order-non-livre': 'order-non-livre',
    'order-livre': 'order-livre'
  };
  return messageMap[message] || null;
}

// Apply translations to page
function applyTranslations(lang) {
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (translations[lang][key]) {
      element.textContent = translations[lang][key];
    }
  });
  document.documentElement.lang = lang;
  document.title = translations[lang]['page-title'];
  sessionStorage.setItem('language', lang);
  const currentCategory = sessionStorage.getItem('selectedCategory') || 'entrees';
  loadCategory(currentCategory);
}

// Format translated string with parameters
function formatTranslation(key, lang, params = {}) {
  let text = translations[lang][key] || key;
  for (const [param, value] of Object.entries(params)) {
    text = text.replace(`{${param}}`, value);
  }
  return text;
}

// Translate server message
function translateServerMessage(message, lang, params = {}) {
  const translationKey = mapServerMessageToTranslationKey(message);
  return translationKey ? formatTranslation(translationKey, lang, params) : message;
}

// Display a toast
function showToast(message, type = 'success') {
  const lang = sessionStorage.getItem('language') || 'fr';
  const translatedMessage = translateServerMessage(message, lang);
  const toastContainer = document.createElement('div');
  toastContainer.className = 'toast-container';
  document.body.appendChild(toastContainer);

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.setAttribute('aria-atomic', 'true');
  toast.innerHTML = `<div class="toast-body">${translatedMessage}</div>`;
  toastContainer.appendChild(toast);

  const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
  bsToast.show();

  toast.addEventListener('hidden.bs.toast', () => {
    toastContainer.remove();
  });
}

// Play a notification sound
function playNotificationSound() {
  const context = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = context.createOscillator();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(440, context.currentTime);
  oscillator.connect(context.destination);
  oscillator.start();
  setTimeout(() => oscillator.stop(), 200);
}

// Play order ready sound
function playOrderReadySound() {
  const context = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = context.createOscillator();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(660, context.currentTime);
  oscillator.connect(context.destination);
  oscillator.start();
  setTimeout(() => oscillator.stop(), 300);
}

// Play delivery sound
function playDeliverySound(isDelivered) {
  const context = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = context.createOscillator();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(isDelivered ? 800 : 300, context.currentTime);
  oscillator.connect(context.destination);
  oscillator.start();
  setTimeout(() => oscillator.stop(), 400);
}
// Socket.IO connection handling
socket.on('connect', () => {
  console.log('✅ Connecté au serveur Socket.IO');
  const lang = sessionStorage.getItem('language') || 'fr';
  const connectionStatus = document.getElementById('connectionStatus');
  if (connectionStatus) {
    connectionStatus.textContent = translations[lang]['connection-status-connected'];
    connectionStatus.className = 'connection-status status-connected';
  }
});

socket.on('connect_error', (error) => {
  console.error('❌ Erreur Socket.IO:', error.message);
  const lang = sessionStorage.getItem('language') || 'fr';
  const connectionStatus = document.getElementById('connectionStatus');
  if (connectionStatus) {
    connectionStatus.textContent = translations[lang]['connection-status-disconnected'];
    connectionStatus.className = 'connection-status status-disconnected';
  }
  showToast(translations[lang]['connection-error'], 'error');
});

// Clear notifications, order history, and table number on tab close
window.addEventListener('beforeunload', async () => {
  const tableNumber = localStorage.getItem('table_id');
  if (tableNumber) {
    try {
      const res = await fetch(`https://restaurant-api-d4x5.onrender.com/api/client/commandes/${tableNumber}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
      });
      const commandes = await res.json();
      const hasPending = commandes.some(c => !c.delivered && ['en attente', 'en preparation'].includes(c.status));
      if (!hasPending) {
        await fetch(`https://restaurant-api-d4x5.onrender.com/api/notifications/${tableNumber}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
        });
        localStorage.removeItem('savedOrders');
        localStorage.removeItem('token');
        localStorage.removeItem('table_id');
        sessionStorage.removeItem('language');
      }
    } catch (err) {
      console.error('Erreur lors de la suppression des notifications:', err);
    }
  }
});

// Initialize on page load
window.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const table = urlParams.get('table');
  const token = urlParams.get('token');

  if (!table || !token) {
    document.body.innerHTML = '<h1>Accès interdit : Veuillez scanner le QR code de votre table</h1>';
    return;
  }

  try {
    const res = await fetch(`https://restaurant-api-d4x5.onrender.com/api/verify-token?table=${table}&token=${token}`);
    const data = await res.json();
    if (!res.ok || !data.valid) {
      document.body.innerHTML = '<h1>Token invalide ou expiré</h1>';
      return;
    }
    localStorage.setItem('token', token);
    localStorage.setItem('table_id', table);
  } catch (err) {
    console.error('Erreur vérification token:', err);
    document.body.innerHTML = '<h1>Erreur de connexion au serveur</h1>';
    return;
  }

  const lang = sessionStorage.getItem('language') || 'fr';
  applyTranslations(lang);

  // Language dropdown logic
  const lngDropdownBtn = document.querySelector('.lng_dropdown_btn');
  const lngDropdownContent = document.querySelector('.lng_dropdown_content');
  const lngDropdownBtnIcon = document.querySelector('.lng_dropdown_btn_icon');
  const lngItems = document.querySelectorAll('.lng_item');
  const lngPreviewImg = document.querySelector('.lng_previeuw img');

  const selectedItem = document.querySelector(`.lng_item[data-lang="${lang}"]`);
  if (selectedItem && lngPreviewImg) {
    lngItems.forEach(i => i.classList.remove('selected'));
    selectedItem.classList.add('selected');
    lngPreviewImg.src = selectedItem.querySelector('.lng_item_previeuw img').src;
    document.querySelector('.lng_dropdown_btn_text span').textContent = lang.toUpperCase();
  }

  if (lngDropdownBtn && lngDropdownContent && lngDropdownBtnIcon) {
    [lngDropdownBtn, lngDropdownBtnIcon].forEach(el => {
      el.addEventListener('click', (e) => {
        lngDropdownBtn.classList.toggle('active');
        lngDropdownContent.classList.toggle('active');
        e.stopPropagation();
      });
    });

    lngItems.forEach(item => {
      item.addEventListener('click', () => {
        lngItems.forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');

        const selectedImg = item.querySelector('.lng_item_previeuw img').src;
        lngPreviewImg.src = selectedImg;

        const selectedText = item.querySelector('.lng_item_text').textContent;
        document.querySelector('.lng_dropdown_btn_text span').textContent = selectedText;

        const selectedLang = item.getAttribute('data-lang');
        applyTranslations(selectedLang);

        lngDropdownBtn.classList.remove('active');
        lngDropdownContent.classList.remove('active');
      });
    });

    document.addEventListener('click', (e) => {
      if (
        !lngDropdownBtn.contains(e.target) &&
        !lngDropdownContent.contains(e.target) &&
        !lngDropdownBtnIcon.contains(e.target)
      ) {
        lngDropdownBtn.classList.remove('active');
        lngDropdownContent.classList.remove('active');
      }
    });
  }
});
// Slides et sélection de catégorie
const savedIndex = sessionStorage.getItem('selectedIndex');
if (savedIndex !== null) {
  const activeLi = document.querySelector(`.slide_bar .li[data-index="${savedIndex}"]`);
  if (activeLi) {
    document.querySelectorAll('.slide_bar .li').forEach(li => li.classList.remove('clicked'));
    activeLi.classList.add('clicked');
    const category = activeLi.getAttribute('data-categorie');
    loadCategory(category);
  }
} else {
  const defaultLi = document.querySelector('.slide_bar .li[data-index="0"]');
  if (defaultLi) {
    defaultLi.classList.add('clicked');
    loadCategory('entrees');
  }
}

document.querySelectorAll('.slide_bar .li').forEach(li => {
  li.addEventListener('click', function () {
    const category = this.getAttribute('data-categorie');
    const index = this.getAttribute('data-index');

    document.querySelectorAll('.slide_bar .li').forEach(li => li.classList.remove('clicked'));
    this.classList.add('clicked');

    sessionStorage.setItem('selectedIndex', index);
    loadCategory(category);
  });
});

// Rotation verticale des lettres du menu
document.querySelectorAll('.li').forEach(li => {
  const a = li.querySelector('a');
  if (a) {
    const text = a.textContent.trim();
    a.innerHTML = '';
    for (const char of text) {
      const span = document.createElement('span');
      span.textContent = char;
      span.style.display = 'inline-block';
      span.style.transform = 'rotate(90deg)';
      a.appendChild(span);
    }
  }
});

// Ouverture des modals panier et rang
document.getElementById('panier-btn').addEventListener('click', showCart);
document.getElementById('rang-btn').addEventListener('click', showRang);

updateCartBadge();

// Gestion clic sur carte et bouton ajouter au panier
document.addEventListener('click', (e) => {
  const card = e.target.closest('.card');
  const addButton = e.target.closest('.add-to-cart');

  if (addButton) {
    e.stopPropagation();
    e.preventDefault();
    const platId = parseInt(addButton.getAttribute('data-id'));
    addToCart(platId);
    return;
  }

  if (card) {
    if (activeCard && activeCard !== card) {
      activeCard.classList.remove('active');
    }
    card.classList.toggle('active');
    activeCard = card.classList.contains('active') ? card : null;
  } else {
    if (activeCard) {
      activeCard.classList.remove('active');
      activeCard = null;
    }
  }
});

// Socket events pour mise à jour
socket.on('platUpdated', (data) => {
  const currentCategory = sessionStorage.getItem('selectedCategory') || 'entrees';
  if (data.categorie === currentCategory) {
    loadCategory(currentCategory);
  }
});

socket.on('commandeStatusUpdated', (data) => {
  const lang = sessionStorage.getItem('language') || 'fr';
  const tableNumber = localStorage.getItem('table_id');
  if (data.status === 'pret' && tableNumber && data.table_id === tableNumber) {
    showToast(formatTranslation('order-ready', lang, { table_id: data.table_id }), 'success');
    playOrderReadySound();
    showRang();
  }
});

socket.on('unavailableNotification', (data) => {
  const lang = sessionStorage.getItem('language') || 'fr';
  const tableNumber = localStorage.getItem('table_id');
  if (tableNumber && data.commandeId && data.table_id === tableNumber) {
    const translatedMessage = translateServerMessage(data.message, lang, { table_id: data.table_id });
    showToast(translatedMessage, data.message.includes('order-ready-reminder') ? 'success' : 'error');
    if (data.message.includes('order-ready-reminder')) {
      playOrderReadySound();
    } else {
      playNotificationSound();
    }
    showRang();
  }
});

// Notifications livraison
socket.on('deliveryNotification', (data) => {
  const lang = sessionStorage.getItem('language') || 'fr';
  const tableNumber = localStorage.getItem('table_id');
  if (tableNumber && data.table_id === tableNumber) {
    const messageKey = data.status_final === 'livre' ? 'order-livre' : 'order-non-livre';
    const translatedMessage = translateServerMessage(messageKey, lang, { table_id: data.table_id });
    showToast(translatedMessage, data.status_final === 'livre' ? 'success' : 'error');
    playDeliverySound(data.status_final === 'livre');
    showRang();
  }
});
// Fonction pour charger une catégorie
async function loadCategory(category) {
  const lang = sessionStorage.getItem('language') || 'fr';
  const container = document.getElementById(category);
  if (!container) return;
  document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
  container.classList.add('active');
  container.innerHTML = '';

  const nameDiv = document.createElement('div');
  nameDiv.className = 'name';

  try {
    const res = await fetch(`https://restaurant-api-d4x5.onrender.com/api/plats/${category}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
    });
    if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
    const plats = await res.json();

    if (!plats || plats.length === 0) {
      nameDiv.innerHTML = `<p class="no-items">${translations[lang]['no-items']}</p>`;
    } else {
      plats.forEach(plat => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
          <div class="card-inner">
            <div class="card-front carding">
              <div class="cot">
                <div class="plat">
                  <img src="${plat.image || './assets/image/default.jpg'}" alt="${plat.nom}">
                </div>
                <div class="mini">
                  <span>${plat.nom}</span>
                </div>
              </div>
              <div class="m">
                <span>${plat.prix} Ar</span>
              </div>
            </div>
            <div class="card-back">
              <div class="content">
                <p>${plat.description}</p>
                <button class="button add-to-cart" data-id="${plat.id}" type="button">${translations[lang]['send-order']}</button>
              </div>
            </div>
          </div>`;
        nameDiv.appendChild(card);
      });
    }
  } catch (err) {
    console.error('Erreur chargement plats:', err);
    nameDiv.innerHTML = `<p class="no-items">${translations[lang]['error-loading-plats']}</p>`;
    showToast(translations[lang]['error-loading-plats'], 'error');
  }

  container.appendChild(nameDiv);
  sessionStorage.setItem('selectedCategory', category);
}

// Ajouter un plat au panier
function addToCart(platId) {
  const lang = sessionStorage.getItem('language') || 'fr';
  fetch(`https://restaurant-api-d4x5.onrender.com/api/plat/${platId}`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
  })
    .then(res => { if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`); return res.json(); })
    .then(plat => { if (plat) addToCartLocal(plat); else throw new Error('Plat non trouvé'); })
    .catch(err => {
      console.error('Erreur ajout au panier:', err);
      showToast(translations[lang]['add-to-cart-error'], 'error');
    });
}

// Mise à jour du badge du panier
function updateCartBadge() {
  const cartBadge = document.getElementById('cart-badge');
  if (cartBadge) {
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    cartBadge.style.display = totalItems > 0 ? 'block' : 'none';
  }
}

// Ajouter localement un plat au panier
function addToCartLocal(plat) {
  const lang = sessionStorage.getItem('language') || 'fr';
  const existingItem = cart.find(item => item.id === plat.id);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ id: plat.id, nom: plat.nom, prix: plat.prix, quantity: 1 });
  }

  updateCartBadge();

  const button = document.querySelector(`.add-to-cart[data-id="${plat.id}"]`);
  if (button) {
    const originalText = button.textContent;
    button.textContent = '✓ ' + translations[lang]['add-to-cart-success'];
    button.style.background = '#4CAF50';
    setTimeout(() => {
      button.textContent = translations[lang]['send-order'];
      button.style.background = '';
    }, 1500);
  }

  showToast(translations[lang]['add-to-cart-success']);
}

// Afficher le panier dans le modal
function showCart() {
  const lang = sessionStorage.getItem('language') || 'fr';
  const cartItemsDiv = document.getElementById('cart-items');
  cartItemsDiv.innerHTML = '';

  const tableId = localStorage.getItem('table_id');
  document.getElementById('table-display').textContent = tableId || translations[lang]['table-number-error'];

  if (cart.length === 0) {
    cartItemsDiv.innerHTML += `<p>${translations[lang]['cart-empty']}</p>`;
  } else {
    cart.forEach((item, index) => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'cart-item';
      itemDiv.innerHTML = `
        <span>${item.nom} - ${item.prix} Ar</span>
        <input type="number" value="${item.quantity}" min="1" data-index="${index}">
        <span class="remove-btn" data-index="${index}">❌</span>
      `;
      cartItemsDiv.appendChild(itemDiv);
    });
  }

  // Commandes passées
  const savedOrders = JSON.parse(localStorage.getItem('savedOrders') || '[]');
  if (savedOrders.length > 0) {
    const pastOrdersDiv = document.createElement('div');
    pastOrdersDiv.className = 'past-orders mt-3';
    pastOrdersDiv.innerHTML = `<h5>${translations[lang]['past-orders']}</h5>`;
    savedOrders.forEach(order => {
      const orderDiv = document.createElement('div');
      orderDiv.className = 'past-order';
      orderDiv.innerHTML = `
        <p><strong>${formatTranslation('table-number-label', lang)} ${order.table_id}</strong> - ${translations[lang]['total-label']}: ${order.total} Ar</p>
        <p>Items: ${order.items.map(item => `${item.nom} x${item.quantity}`).join(', ')}</p>
      `;
      pastOrdersDiv.appendChild(orderDiv);
    });
    cartItemsDiv.appendChild(pastOrdersDiv);
  }

  updateCartTotal();

  // Gestion modification quantité
  cartItemsDiv.querySelectorAll('input').forEach(input => {
    input.addEventListener('change', function () {
      const index = parseInt(this.getAttribute('data-index'));
      const newQty = parseInt(this.value);
      if (newQty >= 1) {
        cart[index].quantity = newQty;
        updateCartBadge();
        updateCartTotal();
      } else this.value = 1;
    });
  });

  // Gestion suppression plat
  cartItemsDiv.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const index = parseInt(this.getAttribute('data-index'));
      cart.splice(index, 1);
      showCart();
      updateCartBadge();
    });
  });

  new bootstrap.Modal(document.getElementById('cartModal')).show();
}

// Calcul et affichage total du panier
function updateCartTotal() {
  const lang = sessionStorage.getItem('language') || 'fr';
  const totalDiv = document.getElementById('cart-total');
  const total = cart.reduce((sum, item) => sum + (item.prix * item.quantity), 0);
  totalDiv.textContent = `${translations[lang]['total-label']}: ${total} Ar`;
}
// Envoi de la commande
document.getElementById('send-order').addEventListener('click', async () => {
  const lang = sessionStorage.getItem('language') || 'fr';
  const tableId = localStorage.getItem('table_id');
  if (!tableId) return showToast('Erreur : Numéro de table non disponible', 'error');
  if (cart.length === 0) return showToast(translations[lang]['cart-empty-error'], 'error');

  const orderData = {
    table_id: tableId,
    items: cart,
    total: cart.reduce((sum, item) => sum + (item.prix * item.quantity), 0),
    status: 'en attente',
    language: lang
  };

  try {
    const res = await fetch('https://restaurant-api-d4x5.onrender.com/commandes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        'Accept-Language': lang
      },
      body: JSON.stringify(orderData)
    });

    if (res.ok) {
      showToast(translations[lang]['order-sent']);
      const savedOrders = JSON.parse(localStorage.getItem('savedOrders') || '[]');
      savedOrders.push(orderData);
      localStorage.setItem('savedOrders', JSON.stringify(savedOrders));
      cart = [];
      updateCartBadge();
      bootstrap.Modal.getInstance(document.getElementById('cartModal')).hide();
    } else {
      const error = await res.json();
      showToast(`${translations[lang]['order-error']}: ${error.error || ''}`, 'error');
    }
  } catch (err) {
    console.error('Erreur envoi commande:', err);
    showToast(translations[lang]['connection-error'], 'error');
  }
});

// Affichage du rang et notifications
function showRang() {
  const lang = sessionStorage.getItem('language') || 'fr';
  const modal = new bootstrap.Modal(document.getElementById('rangModal'));
  modal.show();

  const tableId = localStorage.getItem('table_id');
  document.getElementById('rang-table-display').textContent = tableId || translations[lang]['table-number-error'];

  const infoDiv = document.getElementById('rang-info');
  infoDiv.innerHTML = translations[lang]['loading'];

  fetch(`https://restaurant-api-d4x5.onrender.com/api/client/commandes/${tableId}`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
  })
    .then(res => res.ok ? res.json() : Promise.reject(`Erreur HTTP ${res.status}`))
    .then(commandes => {
      const myCmd = commandes.find(c => c.table_id == tableId && !c.delivered && ['en attente', 'en preparation', 'pret'].includes(c.status));
      if (!myCmd) {
        infoDiv.innerHTML = `<p>${translations[lang]['no-active-order']}</p>`;
        return;
      }

      const pendingOrders = commandes
        .filter(c => !c.delivered && ['en attente', 'en preparation'].includes(c.status))
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      const rank = pendingOrders.findIndex(c => c.id === myCmd.id) + 1;
      const totalPending = pendingOrders.length;

      let statusText = myCmd.status;
      if (myCmd.status === 'en attente') statusText = translations[lang]['status-pending'];
      else if (myCmd.status === 'en preparation') statusText = translations[lang]['status-preparing'];
      else if (myCmd.status === 'pret') statusText = translations[lang]['status-ready'];

      infoDiv.innerHTML = `
        <p><strong>${translations[lang]['status-label']}:</strong> ${statusText}</p>
        ${myCmd.status !== 'pret' ? `<p><strong>${translations[lang]['position-label']}:</strong> ${rank} / ${totalPending}</p>` : ''}
        <p><strong>${translations[lang]['total-label']}:</strong> ${myCmd.total} Ar</p>
        <p><strong>${translations[lang]['time-label']}:</strong> ${new Date(myCmd.created_at).toLocaleTimeString()}</p>
      `;

      const notificationDiv = document.createElement('div');
      notificationDiv.className = 'notification-list mt-3';
      notificationDiv.innerHTML = `<p>${translations[lang]['loading-notifications']}</p>`;
      infoDiv.appendChild(notificationDiv);

      fetch(`https://restaurant-api-d4x5.onrender.com/api/notifications/${tableId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
      })
        .then(resNotif => resNotif.ok ? resNotif.json() : Promise.reject(`Erreur HTTP ${resNotif.status}`))
        .then(notifications => {
          notificationDiv.innerHTML = '';
          if (!Array.isArray(notifications) || notifications.length === 0) {
            notificationDiv.innerHTML = `<p>${translations[lang]['no-notifications']}</p>`;
            document.getElementById('rang-btn').classList.remove('has-notification');
          } else {
            notifications.forEach(notif => {
              const notifItem = document.createElement('div');
              notifItem.className = 'notification-item';
              notifItem.innerHTML = `<p><strong>${new Date(notif.created_at).toLocaleString()}</strong>: ${notif.message}</p>`;
              notificationDiv.appendChild(notifItem);
            });
            document.getElementById('rang-btn').classList.add('has-notification');
          }
        });
    })
    .catch(err => {
      console.error('Erreur chargement rang:', err);
      infoDiv.innerHTML = `<p>${translations[lang]['error-loading-rang']}</p>`;
    });
}
// Socket events pour mise à jour en temps réel
socket.on('platUpdated', (data) => {
  const currentCategory = sessionStorage.getItem('selectedCategory') || 'entrees';
  if (data.categorie === currentCategory) {
    loadCategory(currentCategory);
  }
});

socket.on('commandeStatusUpdated', (data) => {
  const lang = sessionStorage.getItem('language') || 'fr';
  const tableNumber = localStorage.getItem('table_id');
  if (data.status === 'pret' && tableNumber && data.table_id === tableNumber) {
    showToast(formatTranslation('order-ready', lang, { table_id: data.table_id }), 'success');
    playOrderReadySound();
    showRang();
  }
});

socket.on('unavailableNotification', (data) => {
  const lang = sessionStorage.getItem('language') || 'fr';
  const tableNumber = localStorage.getItem('table_id');
  if (tableNumber && data.commandeId && data.table_id === tableNumber) {
    const translatedMessage = translateServerMessage(data.message, lang, { table_id: data.table_id });
    showToast(translatedMessage, data.message.includes('order-ready-reminder') ? 'success' : 'error');
    if (data.message.includes('order-ready-reminder')) {
      playOrderReadySound();
    } else {
      playNotificationSound();
    }
    showRang();
  }
});

socket.on('deliveryNotification', (data) => {
  const lang = sessionStorage.getItem('language') || 'fr';
  const tableNumber = localStorage.getItem('table_id');
  if (tableNumber && data.table_id === tableNumber) {
    const messageKey = data.status_final === 'livre' ? 'order-livre' : 'order-non-livre';
    const translatedMessage = translateServerMessage(messageKey, lang, { table_id: data.table_id });
    showToast(translatedMessage, data.status_final === 'livre' ? 'success' : 'error');
    playDeliverySound(data.status_final === 'livre');
    showRang();
  }
});

// Sons pour notifications
function playNotificationSound() {
  const context = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = context.createOscillator();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(440, context.currentTime);
  oscillator.connect(context.destination);
  oscillator.start();
  setTimeout(() => oscillator.stop(), 200);
}

function playOrderReadySound() {
  const context = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = context.createOscillator();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(660, context.currentTime);
  oscillator.connect(context.destination);
  oscillator.start();
  setTimeout(() => oscillator.stop(), 300);
}

function playDeliverySound(isDelivered) {
  const context = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = context.createOscillator();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(isDelivered ? 800 : 300, context.currentTime);
  oscillator.connect(context.destination);
  oscillator.start();
  setTimeout(() => oscillator.stop(), 400);
}

// Affichage d'un toast global
function showToast(message, type = 'success') {
  const lang = sessionStorage.getItem('language') || 'fr';
  const translatedMessage = translateServerMessage(message, lang);
  const toastContainer = document.createElement('div');
  toastContainer.className = 'toast-container';
  document.body.appendChild(toastContainer);

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.setAttribute('aria-atomic', 'true');
  toast.innerHTML = `<div class="toast-body">${translatedMessage}</div>`;
  toastContainer.appendChild(toast);

  const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
  bsToast.show();

  toast.addEventListener('hidden.bs.toast', () => {
    toastContainer.remove();
  });
}
