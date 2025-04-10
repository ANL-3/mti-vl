// Settings Module
// Handles user settings functionality

// DOM Elements
const darkModeToggle = document.getElementById('dark-mode-toggle');
const tradeNotificationsToggle = document.getElementById('trade-notifications-toggle');
const soundEffectsToggle = document.getElementById('sound-effects-toggle');
const saveSettingsBtn = document.getElementById('save-settings-btn');

// Default settings
const defaultSettings = {
    darkMode: true,
    tradeNotifications: true,
    soundEffects: true
};

// Current settings
let currentSettings = {...defaultSettings};

// Load user settings
function loadUserSettings() {
    // First, try to get settings from localStorage
    const savedSettings = localStorage.getItem('militaryTycoonSettings');
    if (savedSettings) {
        try {
            currentSettings = {...defaultSettings, ...JSON.parse(savedSettings)};
        } catch (error) {
            console.error("Error parsing saved settings:", error);
            currentSettings = {...defaultSettings};
        }
    }
    
    // If user is logged in, try to get settings from Firestore
    if (auth.currentUser) {
        db.collection('users').doc(auth.currentUser.uid)
            .get()
            .then((doc) => {
                if (doc.exists && doc.data().settings) {
                    // Merge settings from Firestore with defaults
                    currentSettings = {...defaultSettings, ...doc.data().settings};
                    
                    // Save merged settings to localStorage
                    localStorage.setItem('militaryTycoonSettings', JSON.stringify(currentSettings));
                    
                    // Apply settings to UI
                    applySettings();
                }
            })
            .catch((error) => {
                console.error("Error loading user settings from Firestore:", error);
            });
    }
    
    // Apply settings from local storage
    applySettings();
}

// Apply settings to UI and functionality
function applySettings() {
    // Apply dark mode
    if (currentSettings.darkMode) {
        document.body.classList.remove('light-mode');
        document.body.classList.add('dark-mode');
        document.getElementById('theme-style').href = 'css/dark-mode.css';
    } else {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
        document.getElementById('theme-style').href = 'css/light-mode.css';
    }
    
    // Set toggle states if on settings page
    if (darkModeToggle) {
        darkModeToggle.checked = currentSettings.darkMode;
    }
    
    if (tradeNotificationsToggle) {
        tradeNotificationsToggle.checked = currentSettings.tradeNotifications;
    }
    
    if (soundEffectsToggle) {
        soundEffectsToggle.checked = currentSettings.soundEffects;
    }
}

// Save settings
function saveSettings() {
    // Update current settings object
    if (darkModeToggle) {
        currentSettings.darkMode = darkModeToggle.checked;
    }
    
    if (tradeNotificationsToggle) {
        currentSettings.tradeNotifications = tradeNotificationsToggle.checked;
    }
    
    if (soundEffectsToggle) {
        currentSettings.soundEffects = soundEffectsToggle.checked;
    }
    
    // Save to localStorage
    localStorage.setItem('militaryTycoonSettings', JSON.stringify(currentSettings));
    
    // If user is logged in, save to Firestore
    if (auth.currentUser) {
        db.collection('users').doc(auth.currentUser.uid)
            .update({
                settings: currentSettings
            })
            .then(() => {
                showAlert("Settings saved successfully!", "success");
            })
            .catch((error) => {
                console.error("Error saving settings to Firestore:", error);
                showAlert("Settings saved locally, but there was an error saving to your account.", "warning");
            });
    } else {
        showAlert("Settings saved locally. Log in to save settings to your account.", "success");
    }
    
    // Apply settings
    applySettings();
}

// Toggle dark mode immediately
function toggleDarkMode() {
    currentSettings.darkMode = !currentSettings.darkMode;
    applySettings();
    
    // Save setting
    localStorage.setItem('militaryTycoonSettings', JSON.stringify(currentSettings));
    
    // If user is logged in, save to Firestore
    if (auth.currentUser) {
        db.collection('users').doc(auth.currentUser.uid)
            .update({
                'settings.darkMode': currentSettings.darkMode
            })
            .catch((error) => {
                console.error("Error saving dark mode setting to Firestore:", error);
            });
    }
}

// Event Listeners
if (darkModeToggle) {
    darkModeToggle.addEventListener('change', toggleDarkMode);
}

if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', saveSettings);
}

// Initialize settings
document.addEventListener('DOMContentLoaded', () => {
    loadUserSettings();
});

// Listen for auth state changes to reload settings
auth.onAuthStateChanged((user) => {
    if (user) {
        // User just logged in, load their settings
        loadUserSettings();
    }
});
