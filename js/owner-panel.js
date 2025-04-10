// Owner Panel Module
// Handles owner panel functionality for system configuration and advanced settings

// Initialize owner panel when document is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Owner panel initializing...');
    initOwnerPanel();
});

// Initialize owner panel
function initOwnerPanel() {
    // Initialize DOM elements
    initializeElements();

    // Check if user is the owner
    checkOwnerAndLoad();
}

// Initialize DOM elements and event listeners
function initializeElements() {
    console.log('Initializing owner panel elements...');

    // Site configuration form
    const siteConfigForm = document.getElementById('site-config-form');
    if (siteConfigForm) {
        siteConfigForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveSiteConfig();
        });
    }

    // Update API key buttons
    const updateSendgridBtn = document.getElementById('update-sendgrid-btn');
    if (updateSendgridBtn) {
        updateSendgridBtn.addEventListener('click', updateSendgridKey);
    }

    const updateGaBtn = document.getElementById('update-ga-btn');
    if (updateGaBtn) {
        updateGaBtn.addEventListener('click', updateGaId);
    }

    // API key reveal toggles
    const revealSendgrid = document.getElementById('reveal-sendgrid');
    if (revealSendgrid) {
        revealSendgrid.addEventListener('click', function() {
            toggleApiKeyVisibility(this, 'SENDGRID_API_KEY');
        });
    }

    const revealGa = document.getElementById('reveal-ga');
    if (revealGa) {
        revealGa.addEventListener('click', function() {
            toggleApiKeyVisibility(this, 'GA_TRACKING_ID');
        });
    }

    // Backup and restore buttons
    const createBackupBtn = document.getElementById('create-backup-btn');
    if (createBackupBtn) {
        createBackupBtn.addEventListener('click', createBackup);
    }

    const restoreBackupBtn = document.getElementById('restore-backup-btn');
    if (restoreBackupBtn) {
        restoreBackupBtn.addEventListener('click', restoreBackup);
    }

    // Download logs button
    const downloadLogsBtn = document.getElementById('download-logs-btn');
    if (downloadLogsBtn) {
        downloadLogsBtn.addEventListener('click', downloadLogs);
    }
}

// Check if the current user is the owner and load content accordingly
function checkOwnerAndLoad() {
    // Try to get the current user from localStorage
    const userJson = localStorage.getItem('currentUser');

    if (userJson) {
        try {
            const user = JSON.parse(userJson);

            // Check if user is owner
            if (user.role === 'owner' || user.email === 'aero81710@gmail.com') {
                console.log('Owner access granted');

                // Show owner content and hide access denied message
                document.getElementById('owner-content').style.display = 'block';
                document.getElementById('owner-access-denied').style.display = 'none';

                // Load site configuration
                loadSiteConfig();

                return;
            }
        } catch (error) {
            console.error('Error parsing user data:', error);
        }
    }

    // If we get here, user is not the owner
    console.log('Owner access denied');
    showAccessDenied();
}

// Show access denied message and hide owner content
function showAccessDenied() {
    document.getElementById('owner-content').style.display = 'none';
    document.getElementById('owner-access-denied').style.display = 'block';
}

// Load site configuration from localStorage
function loadSiteConfig() {
    console.log('Loading site configuration...');

    try {
        // Load site config
        const siteConfigJson = localStorage.getItem('site_config');

        if (siteConfigJson) {
            const siteConfig = JSON.parse(siteConfigJson);

            // Populate form fields with saved values
            document.getElementById('site-name').value = siteConfig.siteName || 'Military Tycoon Value List';
            document.getElementById('site-description').value = siteConfig.siteDescription || 'The official value list for Military Tycoon vehicles';
            document.getElementById('discord-link').value = siteConfig.discordLink || 'https://discord.gg/mpwBJEYh2A';
            document.getElementById('contact-email').value = siteConfig.contactEmail || 'admin@mtvalues.com';

            // Toggle feature switches
            document.getElementById('feature-registration').checked = siteConfig.features?.registration !== false;
            document.getElementById('feature-community').checked = siteConfig.features?.community !== false;
            document.getElementById('feature-calculator').checked = siteConfig.features?.calculator !== false;
            document.getElementById('feature-email-verification').checked = siteConfig.features?.emailVerification !== false;
        }

        // Load API keys (masked)
        const apiKeys = {
            'SENDGRID_API_KEY': localStorage.getItem('SENDGRID_API_KEY') ? '••••••••••••••••••••••' : 'Not set',
            'GA_TRACKING_ID': localStorage.getItem('GA_TRACKING_ID') ? '••••••••••••' : 'Not set'
        };

        // Update API key display
        const sendgridMask = document.querySelector('.api-key-mask:nth-of-type(1)');
        if (sendgridMask) {
            sendgridMask.textContent = apiKeys['SENDGRID_API_KEY'];
        }

        const gaMask = document.querySelector('.api-key-mask:nth-of-type(2)');
        if (gaMask) {
            gaMask.textContent = apiKeys['GA_TRACKING_ID'];
        }

    } catch (error) {
        console.error('Error loading site configuration:', error);
        showAlert('Error loading site configuration', 'danger');
    }
}

// Save site configuration to localStorage
function saveSiteConfig() {
    console.log('Saving site configuration...');

    try {
        // Get values from form
        const siteName = document.getElementById('site-name').value;
        const siteDescription = document.getElementById('site-description').value;
        const discordLink = document.getElementById('discord-link').value;
        const contactEmail = document.getElementById('contact-email').value;

        // Get feature toggles
        const featureRegistration = document.getElementById('feature-registration').checked;
        const featureCommunity = document.getElementById('feature-community').checked;
        const featureCalculator = document.getElementById('feature-calculator').checked;
        const featureEmailVerification = document.getElementById('feature-email-verification').checked;

        // Create site config object
        const siteConfig = {
            siteName: siteName,
            siteDescription: siteDescription,
            discordLink: discordLink,
            contactEmail: contactEmail,
            features: {
                registration: featureRegistration,
                community: featureCommunity,
                calculator: featureCalculator,
                emailVerification: featureEmailVerification
            },
            updatedAt: new Date().toISOString()
        };

        // Save to localStorage
        localStorage.setItem('site_config', JSON.stringify(siteConfig));

        // Show success message
        showAlert('Site configuration saved successfully!', 'success');
    } catch (error) {
        console.error('Error saving site configuration:', error);
        showAlert('Error saving site configuration.', 'danger');
    }
}

// Update SendGrid API key
function updateSendgridKey() {
    console.log('Updating SendGrid API key...');

    // Prompt for new API key
    const apiKey = prompt('Enter your SendGrid API key:');

    if (apiKey) {
        // Save API key to localStorage
        localStorage.setItem('SENDGRID_API_KEY', apiKey);

        // Update mask
        const sendgridMask = document.querySelector('.api-key-mask:nth-of-type(1)');
        if (sendgridMask) {
            sendgridMask.textContent = '••••••••••••••••••••••';
        }

        // Show success message
        showAlert('SendGrid API key updated successfully!', 'success');
    }
}

// Update Google Analytics ID
function updateGaId() {
    console.log('Updating Google Analytics ID...');

    // Prompt for new GA ID
    const gaId = prompt('Enter your Google Analytics ID:');

    if (gaId) {
        // Save GA ID to localStorage
        localStorage.setItem('GA_TRACKING_ID', gaId);

        // Update mask
        const gaMask = document.querySelector('.api-key-mask:nth-of-type(2)');
        if (gaMask) {
            gaMask.textContent = '••••••••••••';
        }

        // Show success message
        showAlert('Google Analytics ID updated successfully!', 'success');
    }
}

// Toggle API key visibility
function toggleApiKeyVisibility(element, keyName) {
    const apiKeyMask = element.previousElementSibling;
    const apiKey = localStorage.getItem(keyName);

    if (!apiKey) {
        apiKeyMask.textContent = 'Not set';
        return;
    }

    if (element.textContent === 'Show') {
        apiKeyMask.textContent = apiKey;
        element.textContent = 'Hide';
    } else {
        apiKeyMask.textContent = '••••••••••••••••••••••';
        element.textContent = 'Show';
    }
}

// Create a backup of all site data
function createBackup() {
    console.log('Creating backup...');

    try {
        // Collect all data from localStorage
        const backup = {
            vehicles: JSON.parse(localStorage.getItem('vehicles') || '[]'),
            users: JSON.parse(localStorage.getItem('users') || '[]'),
            community_posts: JSON.parse(localStorage.getItem('community_posts') || '[]'),
            community_tradeOffers: JSON.parse(localStorage.getItem('community_tradeOffers') || '[]'),
            site_config: JSON.parse(localStorage.getItem('site_config') || '{}'),
            backup_date: new Date().toISOString()
        };

        // Convert to JSON string
        const backupJson = JSON.stringify(backup);

        // Create a download link
        const filename = `mtvalues_backup_${formatDateForFilename(new Date())}.json`;
        const blob = new Blob([backupJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();

        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);

        // Show success message
        showAlert('Backup created successfully!', 'success');
    } catch (error) {
        console.error('Error creating backup:', error);
        showAlert('Error creating backup.', 'danger');
    }
}

// Restore site data from a backup file
function restoreBackup() {
    console.log('Restoring from backup...');

    const fileInput = document.getElementById('backup-file');

    if (!fileInput.files.length) {
        showAlert('Please select a backup file.', 'warning');
        return;
    }

    // Confirm restoration
    if (!confirm('Are you sure you want to restore from backup? This will overwrite all current data.')) {
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const backup = JSON.parse(e.target.result);

            // Validate backup data
            if (!backup.vehicles || !backup.users || !backup.backup_date) {
                showAlert('Invalid backup file.', 'danger');
                return;
            }

            // Restore data to localStorage
            localStorage.setItem('vehicles', JSON.stringify(backup.vehicles));
            localStorage.setItem('users', JSON.stringify(backup.users));
            localStorage.setItem('community_posts', JSON.stringify(backup.community_posts || []));
            localStorage.setItem('community_tradeOffers', JSON.stringify(backup.community_tradeOffers || []));
            localStorage.setItem('site_config', JSON.stringify(backup.site_config || {}));

            // Show success message
            showAlert('Backup restored successfully! Reloading page...', 'success');

            // Reload the page after a delay
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (error) {
            console.error('Error restoring backup:', error);
            showAlert('Error restoring backup. Invalid file format.', 'danger');
        }
    };

    reader.readAsText(file);
}

// Download system logs
function downloadLogs() {
    console.log('Downloading system logs...');

    try {
        // Get log content from console output (placeholder)
        const logContent = document.querySelector('.console-output').innerText;

        // Create a download link
        const filename = `mtvalues_logs_${formatDateForFilename(new Date())}.txt`;
        const blob = new Blob([logContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();

        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);

        // Show success message
        showAlert('Logs downloaded successfully!', 'success');
    } catch (error) {
        console.error('Error downloading logs:', error);
        showAlert('Error downloading logs.', 'danger');
    }
}

// Format date for filename
function formatDateForFilename(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}${month}${day}_${hours}${minutes}`;
}

// Show alert message
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    const container = document.querySelector('.main-content .container');
    container.insertBefore(alertDiv, container.firstChild);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}