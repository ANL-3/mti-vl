// Authentication Module
// Handles user registration, login, logout, and email verification

// DOM elements references for auth-related functionality
let currentUser = null;
const OWNER_EMAIL = "aero81710@gmail.com";
const OWNER_USERNAME = "Aero";

// Initialize local storage if not already done
// Ensure LocalDB system is initialized
if (typeof LocalDB !== 'undefined') {
    LocalDB.init();
    auth.init();
}

// Check authentication state
auth.onAuthStateChanged((user) => {
    // Don't redirect if on login/signup pages
    const onAuthPage = window.location.pathname.includes('login.html') || 
                      window.location.pathname.includes('signup.html');
    
    if (user) {
        // User is signed in
        currentUser = user;
        console.log('Auth state changed - Current user:', currentUser);
        console.log("Auth state changed: User logged in", user);
        
        // Update UI for logged in state
        document.getElementById('login-item')?.style.setProperty('display', 'none');
        document.getElementById('signup-item')?.style.setProperty('display', 'none');
        document.getElementById('divider-item')?.style.setProperty('display', 'block');
        document.getElementById('logout-item')?.style.setProperty('display', 'block');
        
        // First check if user is owner by email
        if (user.email === OWNER_EMAIL) {
            document.getElementById('admin-item')?.style.setProperty('display', 'block');
            document.getElementById('owner-item')?.style.setProperty('display', 'block');
        }
        // Then check roles
        else if (user.role === 'admin' || user.role === 'owner') {
            document.getElementById('admin-item')?.style.setProperty('display', 'block');
            
            // Only show owner panel for owner role
            if (user.role === 'owner') {
                document.getElementById('owner-item')?.style.setProperty('display', 'block');
                
                // Ensure user has owner role saved
                if (user.email === OWNER_EMAIL && user.role !== 'owner') {
                    // Update user role to owner in localStorage
                    try {
                        const users = JSON.parse(localStorage.getItem(LocalDB.USERS_KEY) || '[]');
                        const userIndex = users.findIndex(u => u.email === OWNER_EMAIL);
                        
                        if (userIndex !== -1) {
                            users[userIndex].role = 'owner';
                            localStorage.setItem(LocalDB.USERS_KEY, JSON.stringify(users));
                            
                            // Update current user
                            currentUser.role = 'owner';
                            localStorage.setItem(LocalDB.CURRENT_USER_KEY, JSON.stringify(currentUser));
                            console.log("User role updated to owner");
                        }
                    } catch (error) {
                        console.error("Error updating user role:", error);
                    }
                }
            }
        }
        
        // Check if email is verified
        if (user.emailVerified) {
            // Email is verified
            console.log("Email is verified");
        } else {
            // Email is not verified
            console.log("Email is not verified");
            
            // If on a page that requires verification, redirect to verify page
            if (window.location.pathname.includes('ads.html')) {
                window.location.href = 'verify-email.html';
            }
        }
        
        // Show username in navbar if it exists
        const usernameDisplay = document.getElementById('username-display');
        if (usernameDisplay) {
            usernameDisplay.textContent = user.username || user.email.split('@')[0];
        }
    } else {
        // User is signed out
        currentUser = null;
        console.log("Auth state changed: User logged out");
        
        // Update UI for logged out state
        document.getElementById('login-item')?.style.setProperty('display', 'block');
        document.getElementById('signup-item')?.style.setProperty('display', 'block');
        document.getElementById('divider-item')?.style.setProperty('display', 'none');
        document.getElementById('logout-item')?.style.setProperty('display', 'none');
        document.getElementById('admin-item')?.style.setProperty('display', 'none');
        document.getElementById('owner-item')?.style.setProperty('display', 'none');
        
        // Reset username display
        const usernameDisplay = document.getElementById('username-display');
        if (usernameDisplay) {
            usernameDisplay.textContent = 'Account';
        }
    }
});

// Logout functionality
document.getElementById('logout-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    auth.signOut().then(() => {
        showAlert('You have been logged out successfully', 'success');
        
        // Check if we're on the index page or a subpage
        const isIndexPage = window.location.pathname === '/' || 
                          window.location.pathname === '/index.html';
        
        setTimeout(() => {
            if (isIndexPage) {
                // If already on index page, just reload
                window.location.reload();
            } else {
                // If on subpage, navigate to index
                window.location.href = '../index.html';
            }
        }, 1500);
    }).catch((error) => {
        showAlert(`Error: ${error.message}`, 'danger');
    });
});

// Register new user
function registerUser(email, username, password) {
    console.log("Registering user:", email, username);
    
    try {
        // Always use the LocalDB system for now
        return auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                console.log("User registered successfully:", userCredential);
                
                // Get the user object
                const user = userCredential.user;
                
                // Update username if provided
                if (username && username.trim() !== '') {
                    // Get all users
                    const users = JSON.parse(localStorage.getItem(LocalDB.USERS_KEY) || '[]');
                    // Find current user
                    const userIndex = users.findIndex(u => u.id === user.id);
                    
                    if (userIndex !== -1) {
                        // Update username
                        users[userIndex].username = username;
                        // Save back to localStorage
                        localStorage.setItem(LocalDB.USERS_KEY, JSON.stringify(users));
                        
                        // Update current user
                        user.username = username;
                        localStorage.setItem(LocalDB.CURRENT_USER_KEY, JSON.stringify(user));
                        
                        // Update auth current user
                        auth.currentUser = user;
                    }
                }
                
                // Simulate email verification (for demo)
                simulateEmailVerification(user);
                return user;
            });
    } catch (error) {
        console.error("Registration error:", error);
        return Promise.reject(error);
    }
}

// Simulate email verification (for demo purposes)
function simulateEmailVerification(user) {
    // In a real app, this would send an actual email
    // For demo, we'll just verify the user directly
    showAlert('Verification email would be sent in a real app. For this demo, your account is now verified.', 'success');
    
    // Immediately verify the email for demo purposes
    try {
        // Find and update the user in local storage
        const users = JSON.parse(localStorage.getItem(LocalDB.USERS_KEY) || '[]');
        const userIndex = users.findIndex(u => u.id === user.id);
        
        if (userIndex !== -1) {
            users[userIndex].emailVerified = true;
            localStorage.setItem(LocalDB.USERS_KEY, JSON.stringify(users));
            
            // Update current user if logged in
            if (auth.currentUser && auth.currentUser.id === user.id) {
                auth.currentUser.emailVerified = true;
                localStorage.setItem(LocalDB.CURRENT_USER_KEY, JSON.stringify(auth.currentUser));
            }
        }
    } catch (error) {
        console.error("Error verifying email:", error);
    }
}

// Login with email/password
function loginUser(email, password) {
    return auth.signInWithEmailAndPassword(email, password);
}

// Login with Google - REMOVED
function loginWithGoogle() {
    // This function is kept as a placeholder but functionality is removed
    return Promise.reject(new Error('Google login is not available'));
}

// Send email verification
function sendVerificationEmail() {
    if (currentUser && !currentUser.emailVerified) {
        // Simulate email verification for demo
        simulateEmailVerification(currentUser);
        return Promise.resolve();
    }
    return Promise.reject(new Error('No user is currently logged in or email is already verified'));
}

// Check if user is admin
async function isAdmin() {
    if (!currentUser) return false;
    return currentUser.role === 'admin' || currentUser.role === 'owner';
}

// Check if user is owner
async function isOwner() {
    if (!currentUser) return false;
    const isOwnerRole = currentUser.role === 'owner';
    const isOwnerEmail = currentUser.email === OWNER_EMAIL;
    console.log('Checking owner status:', {currentUser, isOwnerRole, isOwnerEmail});
    return isOwnerRole || isOwnerEmail;
}

// Show alert message
function showAlert(message, type) {
    // Check if alert container exists, if not create it
    let alertContainer = document.querySelector('.alert-container');
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.className = 'alert-container';
        alertContainer.style.position = 'fixed';
        alertContainer.style.top = '20px';
        alertContainer.style.right = '20px';
        alertContainer.style.zIndex = '1000';
        document.body.appendChild(alertContainer);
    }
    
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.style.marginBottom = '10px';
    alert.style.transition = 'opacity 0.5s';
    alert.innerHTML = message;
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'close';
    closeButton.style.marginLeft = '15px';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => {
        alert.style.opacity = '0';
        setTimeout(() => {
            alertContainer.removeChild(alert);
        }, 500);
    });
    
    alert.appendChild(closeButton);
    alertContainer.appendChild(alert);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alert.parentNode === alertContainer) {
            alert.style.opacity = '0';
            setTimeout(() => {
                if (alert.parentNode === alertContainer) {
                    alertContainer.removeChild(alert);
                }
            }, 500);
        }
    }, 5000);
}
