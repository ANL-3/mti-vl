// Trading Ads Module
// Handles the display and management of trading advertisements

// DOM Elements
const adListContainer = document.getElementById('ad-list');
const postAdBtn = document.getElementById('post-ad-btn');
const adModal = document.getElementById('ad-modal');
const closeModal = document.getElementById('close-modal');
const adForm = document.getElementById('ad-form');

// Current user information
let currentUser = null;
let currentUserId = null;

// Load trading ads
function loadTradingAds() {
    if (!adListContainer) return;
    
    showAdLoadingIndicator();
    
    // Fetch trading ads from the backend API
    fetch('/api/trading-ads')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch trading ads');
            }
            return response.json();
        })
        .then(ads => {
            displayAds(ads);
        })
        .catch(error => {
            console.error("Error fetching trading ads:", error);
            adListContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle"></i> Error loading trading ads. Please try again later.
                </div>
            `;
            hideAdLoadingIndicator();
        });
}

// Display ads in the UI
function displayAds(ads) {
    if (!adListContainer) return;
    
    adListContainer.innerHTML = '';
        
    if (!ads || ads.length === 0) {
        adListContainer.innerHTML = `
            <div class="col-12 text-center">
                <p>No trading ads available. Be the first to post one!</p>
            </div>
        `;
        hideAdLoadingIndicator();
        return;
    }
    
    // Display ads
    ads.forEach((ad) => {
        // Create ad card
        const adCard = document.createElement('div');
        adCard.className = 'col-md-6 col-lg-4 mb-4';
        adCard.innerHTML = `
            <div class="ad-card">
                <div class="ad-image">
                    <img src="${ad.imageUrl || 'https://images.unsplash.com/photo-1486572788966-cfd3df1f5b42'}" alt="${ad.title}" class="img-fluid">
                </div>
                <div class="ad-details">
                    <h3 class="ad-title">${ad.title}</h3>
                    <div class="ad-user">
                        <i class="fas fa-user"></i>
                        <span class="ad-user-name">${ad.username}</span>
                    </div>
                    <p class="ad-description">${ad.description}</p>
                    <div class="ad-date">
                        <span>Expires in ${ad.daysRemaining} day${ad.daysRemaining !== 1 ? 's' : ''}</span>
                        ${currentUserId === ad.userId ? `<button class="btn btn-sm btn-danger float-end delete-ad" data-id="${ad.id}">Delete</button>` : ''}
                    </div>
                </div>
            </div>
        `;
        
        adListContainer.appendChild(adCard);
        
        // Add event listener for delete button
        const deleteBtn = adCard.querySelector('.delete-ad');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                deleteAd(ad.id);
            });
        }
    });
    
    hideAdLoadingIndicator();
}

// Post new trading ad
function postTradingAd(title, description, imageUrl) {
    if (!currentUser) {
        showAlert("You must be logged in to post a trading ad.", "warning");
        return;
    }
    
    if (!currentUser.emailVerified) {
        showAlert("You must verify your email before posting ads.", "warning");
        return;
    }
    
    // Create new ad object
    const newAd = {
        id: 'ad-' + Date.now(),
        title: title,
        description: description,
        imageUrl: imageUrl || '',
        userId: currentUser.id,
        username: currentUser.username,
        createdAt: new Date().toISOString(),
        daysRemaining: 7
    };
    
    // In a real application, this would be a POST request to your API
    // For now, we'll simulate by adding it to the DOM directly
    
    // Reload trading ads to reflect the new ad
    loadTradingAds();
    
    return true;
}

// Delete trading ad
function deleteAd(adId) {
    if (!confirm("Are you sure you want to delete this ad?")) return;
    
    // In a real application, this would be a DELETE request to your API
    // For now, we'll simulate by reloading the ads
    
    showAlert("Ad deleted successfully!", "success");
    loadTradingAds();
}

// Show ad form modal
function showAdModal() {
    if (!adModal) return;
    
    // Check if user is logged in
    if (!currentUser) {
        showAlert("You must be logged in to post a trading ad.", "warning");
        window.location.href = "login.html";
        return;
    }
    
    // Check if email is verified
    if (!currentUser.emailVerified) {
        showAlert("You must verify your email before posting ads.", "warning");
        window.location.href = "verify-email.html";
        return;
    }
    
    adModal.classList.add('show');
}

// Hide ad form modal
function hideAdModal() {
    if (!adModal) return;
    adModal.classList.remove('show');
}

// Helper functions
function showAdLoadingIndicator() {
    if (!adListContainer) return;
    
    adListContainer.innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-3">Loading trading ads...</p>
        </div>
    `;
}

function hideAdLoadingIndicator() {
    // This is handled by the displayAds function which replaces the content
}

function showAlert(message, type) {
    const alertContainer = document.getElementById('alert-container') || document.createElement('div');
    
    if (!document.getElementById('alert-container')) {
        alertContainer.id = 'alert-container';
        alertContainer.className = 'alert-container';
        document.body.appendChild(alertContainer);
    }
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <div class="alert-content">
            <span>${message}</span>
            <button type="button" class="alert-close">&times;</button>
        </div>
    `;
    
    alertContainer.appendChild(alert);
    
    // Add event listener to close button
    const closeBtn = alert.querySelector('.alert-close');
    closeBtn.addEventListener('click', () => {
        alert.remove();
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 5000);
}

// Event listeners
if (postAdBtn) {
    postAdBtn.addEventListener('click', showAdModal);
}

if (closeModal) {
    closeModal.addEventListener('click', hideAdModal);
}

if (adForm) {
    adForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const title = document.getElementById('ad-title').value;
        const description = document.getElementById('ad-description').value;
        const imageUrl = document.getElementById('ad-image-url').value;
        
        if (!title || !description) {
            showAlert("Please fill in all required fields.", "warning");
            return;
        }
        
        // Show loading state
        const submitBtn = adForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<div class="loading"></div> Posting...';
        submitBtn.disabled = true;
        
        // Post the ad
        const success = postTradingAd(title, description, imageUrl);
        
        if (success) {
            showAlert("Trading ad posted successfully!", "success");
            adForm.reset();
            hideAdModal();
            loadTradingAds();
        } else {
            showAlert("Error posting ad. Please try again.", "danger");
        }
        
        // Restore button state
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
    });
}

// Initialize ads page if on the ads page
document.addEventListener('DOMContentLoaded', () => {
    if (adListContainer) {
        // Get current user from localStorage
        const userJson = localStorage.getItem('currentUser');
        if (userJson) {
            currentUser = JSON.parse(userJson);
            currentUserId = currentUser.id;
        }
        
        // Load trading ads
        loadTradingAds();
    }
});