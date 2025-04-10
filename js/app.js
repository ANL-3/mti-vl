// Main Application Module
// Handles general app functionality and initialization

// Initialize EmailJS for email verification
(function() {
    // Public key for EmailJS - using a default key (can be updated later with a real key)
    emailjs.init("user_example123456");
})();

// DOM elements for global use
const themeToggleBtns = document.querySelectorAll('.theme-toggle');

// Force dark mode for the entire application
document.addEventListener('DOMContentLoaded', () => {
    // Apply dark mode - no options to change
    document.body.classList.add('dark-mode');
    document.body.classList.remove('light-mode');
    
    // Check if we're on index.html or a page within /pages/ folder
    const themeStyle = document.getElementById('theme-style');
    if (themeStyle) {
        const isRootPage = window.location.pathname === '/' || 
                          window.location.pathname === '/index.html';
        themeStyle.href = isRootPage ? 'css/dark-mode.css' : '../css/dark-mode.css';
    }
    
    // Set dark mode in settings
    const defaultSettings = {
        darkMode: true
    };
    localStorage.setItem('militaryTycoonSettings', JSON.stringify(defaultSettings));
});

// Theme toggles are now disabled - always dark mode
themeToggleBtns.forEach(btn => {
    btn.style.display = 'none'; // Hide any theme toggle buttons
});

// Theme toggling is disabled - force dark mode only
function toggleTheme() {
    // Do nothing - theme is forced to dark mode
    console.log("Theme toggling is disabled - site is permanently in dark mode.");
}

// Handle modals
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
        // Close the modal when clicking outside
        e.target.classList.remove('show');
    }
});

// Validate email function
function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

// Format date function
function formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(date).toLocaleDateString('en-US', options);
}

// Scroll to top button functionality
const scrollTopBtn = document.getElementById('scroll-top-btn');

if (scrollTopBtn) {
    // Show/hide button based on scroll position
    window.addEventListener('scroll', () => {
        if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
            scrollTopBtn.style.display = 'block';
        } else {
            scrollTopBtn.style.display = 'none';
        }
    });

    // Scroll to top when button clicked
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Tooltips initialization
const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
if (tooltips.length) {
    tooltips.forEach(tooltip => {
        new bootstrap.Tooltip(tooltip);
    });
}

// Global function to check if email is verified
function checkEmailVerification() {
    if (auth.currentUser) {
        // With local storage auth, we directly check emailVerified status (no reload needed)
        if (!auth.currentUser.emailVerified) {
            // Redirect to verify-email page if on protected pages
            const restrictedPages = ['ads.html', 'admin.html'];
            const currentPage = window.location.pathname.split('/').pop();
            
            if (restrictedPages.includes(currentPage)) {
                window.location.href = 'verify-email.html';
            }
        }
    }
}

// Check email verification status when auth state changes
auth.onAuthStateChanged(user => {
    if (user) {
        checkEmailVerification();
    }
});

// Function to send email verification using our backend API
function sendVerificationEmail(to_email, to_name, verification_link) {
    if (!auth.currentUser) {
        console.error('No user is logged in');
        return Promise.reject(new Error('No user is logged in'));
    }
    
    // Call our server API to send verification email
    return fetch('/api/send-verification', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            userId: auth.currentUser.id,
            email: to_email || auth.currentUser.email,
            username: to_name || auth.currentUser.username
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to send verification email');
        }
        return response.json();
    })
    .then(data => {
        console.log('Verification email sent:', data);
        
        // For demonstration purposes, display the verification link
        // In a real app, the link would be sent via email
        if (data.verificationLink) {
            showAlert(`
                <strong>Verification Link Created!</strong><br>
                <small>In a real app, this would be sent to your email. For demo purposes, you can click this link:</small><br>
                <a href="${data.verificationLink}" class="alert-link" target="_blank">Verify Email</a>
            `, 'info');
        }
        
        return data;
    })
    .catch(error => {
        console.error('Error sending verification email:', error);
        throw error;
    });
}

// Initialize clipboard functionality for sharing
const clipboardBtns = document.querySelectorAll('.copy-to-clipboard');
clipboardBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-clipboard-text');
        if (text) {
            navigator.clipboard.writeText(text).then(() => {
                // Show success message
                const originalText = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                setTimeout(() => {
                    btn.innerHTML = originalText;
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy text: ', err);
            });
        }
    });
});

// Function to send custom events to analytics (if implemented)
function sendEvent(eventName, eventParams = {}) {
    if (typeof firebase !== 'undefined' && firebase.analytics) {
        firebase.analytics().logEvent(eventName, eventParams);
    }
    console.log(`Event: ${eventName}`, eventParams);
}

// Document ready event
document.addEventListener('DOMContentLoaded', function() {
    console.log('Military Tycoon Value List initialized');
    
    // Initialize LocalDB storage system
    try {
        LocalDB.init();
        LocalDB.auth.init();
        console.log('LocalDB initialized successfully');
    } catch (error) {
        console.error('Error initializing LocalDB:', error);
    }
    
    // Track page view
    sendEvent('page_view', {
        page_title: document.title,
        page_location: window.location.href,
        page_path: window.location.pathname
    });
});
