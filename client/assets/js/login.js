// Function to display a toast
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
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    toastContainer.appendChild(toast);

    const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
    bsToast.show();

    toast.addEventListener('hidden.bs.toast', () => {
        toastContainer.remove();
    });
}

// Slider Auto (Horizontal)
const mainSlider = document.getElementById('mainSlider');
let currentSlide = 0;
const slideCount = document.querySelectorAll('.slide').length;
let autoSlideInterval;

function goToSlide(index) {
    currentSlide = (index + slideCount) % slideCount;
    mainSlider.style.transform = `translateX(-${currentSlide * 100}%)`;
    document.querySelectorAll('.thumbnail').forEach((thumb, i) => {
        thumb.classList.toggle('active', i === currentSlide);
    });
}

function nextSlide() {
    goToSlide(currentSlide + 1);
}

function prevSlide() {
    goToSlide(currentSlide - 1);
}

function startAutoSlide() {
    autoSlideInterval = setInterval(nextSlide, 5000);
}

function stopAutoSlide() {
    clearInterval(autoSlideInterval);
}
// Formulaire Login/Register
const conteneur = document.getElementById('conteneur');
const registreBtn = document.getElementById('registre');
const loginBtn = document.getElementById('login');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const forgotPasswordContainer = document.getElementById('forgotPasswordContainer');
const resetPasswordContainer = document.getElementById('resetPasswordContainer');

registreBtn.addEventListener('click', () => {
    conteneur.classList.add('active');
    setTimeout(() => {
        document.querySelector('.sign-in').style.display = 'none';
        document.querySelector('.sign-up').style.display = 'flex';
    }, 300);
});

loginBtn.addEventListener('click', () => {
    conteneur.classList.remove('active');
    document.querySelector('.sign-in').style.display = 'flex';
    document.querySelector('.sign-up').style.display = 'none';
});

// Gestion du lien "Mot de passe oublié"
forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    conteneur.style.display = 'none';
    forgotPasswordContainer.style.display = 'block';
    resetPasswordContainer.style.display = 'none';
});

// Gestion du lien "Retour à la connexion"
document.querySelectorAll('#backToLogin, #backToLoginFromReset').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        conteneur.style.display = 'block';
        forgotPasswordContainer.style.display = 'none';
        resetPasswordContainer.style.display = 'none';
        document.querySelector('.sign-in').style.display = 'flex';
        document.querySelector('.sign-up').style.display = 'none';
        window.history.replaceState({}, document.title, window.location.pathname);
    });
});
// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    // Slider
    const mainSlider = document.getElementById('mainSlider');
    let currentSlide = 0;
    const slideCount = document.querySelectorAll('.slide').length;
    let autoSlideInterval;

    function goToSlide(index) {
        currentSlide = (index + slideCount) % slideCount;
        mainSlider.style.transform = `translateX(-${currentSlide * 100}%)`;
        document.querySelectorAll('.thumbnail').forEach((thumb, i) => {
            thumb.classList.toggle('active', i === currentSlide);
        });
    }

    function nextSlide() { goToSlide(currentSlide + 1); }
    function prevSlide() { goToSlide(currentSlide - 1); }
    function startAutoSlide() { autoSlideInterval = setInterval(nextSlide, 5000); }
    function stopAutoSlide() { clearInterval(autoSlideInterval); }

    startAutoSlide();
    mainSlider.addEventListener('mouseenter', stopAutoSlide);
    mainSlider.addEventListener('mouseleave', startAutoSlide);

    // Navigation des slides
    document.getElementById('prevBtn').addEventListener('click', prevSlide);
    document.getElementById('nextBtn').addEventListener('click', nextSlide);
    document.querySelectorAll('.thumbnail').forEach(thumb => {
        thumb.addEventListener('click', () => {
            goToSlide(parseInt(thumb.getAttribute('data-index')));
        });
    });

    // Reset login form fields pour déconnexion (renforcé)
    const signInForm = document.getElementById('signInForm');
    if (signInForm) {
        signInForm.reset();
        signInForm.querySelector('input[name="username"]').value = '';
        signInForm.querySelector('input[name="password"]').value = '';
        signInForm.querySelector('input[name="username"]').focus();
        signInForm.querySelector('input[name="password"]').focus();
        signInForm.querySelector('input[name="username"]').blur();
        signInForm.querySelector('input[name="password"]').blur();
    }

    // Vérifier si un token de réinitialisation est présent dans l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
        conteneur.style.display = 'none';
        forgotPasswordContainer.style.display = 'none';
        resetPasswordContainer.style.display = 'block';
        resetPasswordContainer.querySelector('input[name="token"]').value = token;
    }
});
// Gestion du formulaire de connexion
if (signInForm) {
    signInForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = e.target.querySelector('input[name="username"]').value;
        const password = e.target.querySelector('input[name="password"]').value;

        if (!username || !password) {
            showToast('Remplissez tous les champs', 'error');
            return;
        }

        try {
            const res = await fetch('https://restaurant-api-d4x5.onrender.com/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('adminToken', data.token);
                window.location.href = 'admin.html';
            } else {
                showToast(data.error || 'Erreur lors de la connexion', 'error');
            }
        } catch {
            showToast('Erreur lors de la connexion', 'error');
        }
    });
}

// Gestion du formulaire d'inscription
const signUpForm = document.querySelector('.sign-up form');
if (signUpForm) {
    signUpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nom = e.target.querySelector('input[name="nom"]').value;
        const email = e.target.querySelector('input[name="email"]').value;
        const password = e.target.querySelector('input[name="password"]').value;

        if (!nom || !email || !password) {
            showToast('Remplissez tous les champs', 'error');
            return;
        }
        if (!email.includes('@')) {
            showToast('Email invalide', 'error');
            return;
        }

        try {
            const res = await fetch('https://restaurant-api-d4x5.onrender.com/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            const data = await res.json();
            if (res.ok) {
                conteneur.classList.remove('active');
                document.querySelector('.sign-in').style.display = 'flex';
                document.querySelector('.sign-up').style.display = 'none';
            } else {
                showToast(data.error || 'Erreur lors de l\'inscription', 'error');
            }
        } catch {
            showToast('Erreur lors de l\'inscription', 'error');
        }
    });
}

// Formulaire "Mot de passe oublié"
const forgotPasswordForm = document.getElementById('forgotPasswordForm');
if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = e.target.querySelector('input[name="email"]').value;

        if (!email) {
            showToast('Remplissez tous les champs', 'error');
            return;
        }
        if (!email.includes('@')) {
            showToast('Email invalide', 'error');
            return;
        }

        try {
            const res = await fetch('https://restaurant-api-d4x5.onrender.com/api/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (res.ok) {
                conteneur.style.display = 'block';
                forgotPasswordContainer.style.display = 'none';
                resetPasswordContainer.style.display = 'none';
                document.querySelector('.sign-in').style.display = 'flex';
                document.querySelector('.sign-up').style.display = 'none';
            } else {
                showToast(data.error || 'Erreur lors de la demande de réinitialisation', 'error');
            }
        } catch {
            showToast('Erreur lors de la demande de réinitialisation', 'error');
        }
    });
}

// Formulaire de réinitialisation du mot de passe
const resetPasswordForm = document.getElementById('resetPasswordForm');
if (resetPasswordForm) {
    resetPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = e.target.querySelector('input[name="token"]').value;
        const password = e.target.querySelector('input[name="password"]').value;

        if (!token || !password) {
            showToast('Remplissez tous les champs', 'error');
            return;
        }

        try {
            const res = await fetch('https://restaurant-api-d4x5.onrender.com/api/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password })
            });
            const data = await res.json();
            if (res.ok) {
                conteneur.style.display = 'block';
                forgotPasswordContainer.style.display = 'none';
                resetPasswordContainer.style.display = 'none';
                document.querySelector('.sign-in').style.display = 'flex';
                document.querySelector('.sign-up').style.display = 'none';
                window.history.replaceState({}, document.title, window.location.pathname);
            } else {
                showToast(data.error || 'Erreur lors de la réinitialisation', 'error');
            }
        } catch {
            showToast('Erreur lors de la réinitialisation', 'error');
        }
    });
}

// Show/hide password
document.querySelectorAll('.password-container').forEach(container => {
    const input = container.querySelector('input[type="password"]');
    const toggle = container.querySelector('.toggle-password');

    toggle.addEventListener('click', () => {
        if (input.type === 'password') {
            input.type = 'text';
            toggle.textContent = '👁️';
        } else {
            input.type = 'password';
            toggle.textContent = '👁️‍🗨️';
        }
    });
});
// Redimensionnement des slides
window.addEventListener('resize', () => {
    const slides = document.querySelectorAll('.slide');
    const sliderWidth = document.querySelector('.slider-container').offsetWidth;
    slides.forEach(slide => {
        slide.style.minWidth = `${sliderWidth}px`;
    });
});

// Initialisation de la taille au chargement
window.dispatchEvent(new Event('resize'));
