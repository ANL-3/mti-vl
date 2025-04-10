// Ads Module
// Handles trading ads functionality

// Collection references
const adsRef = db.collection('tradingAds');

// DOM Elements
const adListContainer = document.getElementById('ad-list');
const postAdBtn = document.getElementById('post-ad-btn');
const adModal = document.getElementById('ad-modal');
const closeModal = document.getElementById('close-modal');
const adForm = document.getElementById('ad-form');

// Current user
let currentUserId = null;

// Load trading ads
function loadTradingAds() {
    if (!adListContainer) return;
    
    showAdLoadingIndicator();
    
    // Determine if we should use the backend API or local sample data
    const useApi = window.location.origin.includes('localhost') || window.location.origin.includes('replit');
    
    if (useApi) {
        // Use the API to fetch trading ads
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
    } else {
        // Fallback to local sample data
        try {
            const sampleAds = JSON.parse(localStorage.getItem('tradingAds') || '[]');
            displayAds(sampleAds);
        } catch (error) {
            console.error("Error loading local trading ads:", error);
            adListContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle"></i> Error loading trading ads. Please try again later.
                </div>
            `;
            hideAdLoadingIndicator();
        }
    }
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
        return Promise.reject(new Error("User not logged in"));
    }
    
    if (!currentUser.emailVerified) {
        showAlert("You must verify your email before posting ads.", "warning");
        return Promise.reject(new Error("Email not verified"));
    }
    
    const newAd = {
        title: title,
        description: description,
        imageUrl: imageUrl,
        userId: currentUser.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    };
    
    return adsRef.add(newAd);
}

// Delete trading ad
function deleteAd(adId) {
    if (!confirm("Are you sure you want to delete this ad?")) return;
    
    adsRef.doc(adId).delete()
        .then(() => {
            showAlert("Ad deleted successfully!", "success");
            loadTradingAds();
        })
        .catch((error) => {
            console.error("Error deleting ad:", error);
            showAlert("Error deleting ad. Please try again.", "danger");
        });
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
        
        postTradingAd(title, description, imageUrl)
            .then(() => {
                showAlert("Trading ad posted successfully!", "success");
                adForm.reset();
                hideAdModal();
                loadTradingAds();
            })
            .catch((error) => {
                console.error("Error posting ad:", error);
                showAlert("Error posting ad: " + error.message, "danger");
            })
            .finally(() => {
                // Restore button state
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            });
    });
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
    // This is handled by the loadTradingAds function which replaces the content
}

// Initialize ads page if on the ads page
if (adListContainer) {
    // Update current user ID when auth state changes
    auth.onAuthStateChanged((user) => {
        currentUserId = user ? user.id : null;
        currentUser = user; // Ensure currentUser is set
        loadTradingAds();
    });
    
    // Load trading ads immediately as well
    loadTradingAds();
}
