// Community Module
// Handles community forum posts, comments, and trade offers

// Data structures for community content
let posts = [];
let tradeOffers = [];

// DOM Elements
const postsContainer = document.getElementById('posts-container');
const tradeOffersContainer = document.getElementById('trade-offers-container');
const newPostBtn = document.getElementById('new-post-btn');
const newPostModal = document.getElementById('new-post-modal');
const closePostModal = document.getElementById('close-post-modal');
const newPostForm = document.getElementById('new-post-form');
const cancelPostBtn = document.getElementById('cancel-post');
const addTradeOfferBtn = document.getElementById('add-trade-offer-btn');
const addTradeModal = document.getElementById('add-trade-modal');
const closeTradeModal = document.getElementById('close-trade-modal');
const newTradeForm = document.getElementById('new-trade-form');
const cancelTradeBtn = document.getElementById('cancel-trade');
const paginationControls = document.querySelector('.pagination');

// Current user
let currentUser = null;

// Initialize community page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Community page initializing...');
    console.log('DOM elements:');
    console.log('- New post button:', newPostBtn ? 'Found' : 'Not found');
    console.log('- Add trade offer button:', addTradeOfferBtn ? 'Found' : 'Not found');
    console.log('- Posts container:', postsContainer ? 'Found' : 'Not found');
    console.log('- Trade offers container:', tradeOffersContainer ? 'Found' : 'Not found');
    
    // Get current user from LocalDB
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
        try {
            currentUser = JSON.parse(userJson);
            console.log('User loaded:', currentUser.username || currentUser.email);
            
            // Show delete buttons for admin users
            if (currentUser.role === 'admin' || currentUser.role === 'owner') {
                console.log('Admin user detected, enabling delete functionality');
                document.querySelectorAll('.admin-controls').forEach(control => {
                    control.style.display = 'block';
                });
            }
        } catch (error) {
            console.error('Error parsing user data:', error);
        }
    } else {
        console.log('No user logged in');
    }
    
    // Load existing data from localStorage
    loadCommunityData();
    
    // Clear template content and render actual content
    clearTemplateContent();
    renderPosts();
    renderTradeOffers();
    
    // Add event listeners
    setupEventListeners();
    
    // Add global event handlers for buttons
    document.getElementById('new-post-btn').addEventListener('click', function() {
        console.log('New post button clicked');
        showNewPostModal();
    });
    
    document.getElementById('add-trade-offer-btn').addEventListener('click', function() {
        console.log('Add trade offer button clicked');
        showAddTradeModal();
    });
    
    // For debugging modals
    window.showNewPostModal = showNewPostModal;
    window.showAddTradeModal = showAddTradeModal;
});

// Load community data from localStorage
function loadCommunityData() {
    try {
        const savedPosts = localStorage.getItem('community_posts');
        if (savedPosts) {
            posts = JSON.parse(savedPosts);
        } else {
            // Initialize with empty array
            posts = [];
            localStorage.setItem('community_posts', JSON.stringify(posts));
        }
        
        const savedTradeOffers = localStorage.getItem('community_tradeOffers');
        if (savedTradeOffers) {
            tradeOffers = JSON.parse(savedTradeOffers);
        } else {
            // Initialize with empty array
            tradeOffers = [];
            localStorage.setItem('community_tradeOffers', JSON.stringify(tradeOffers));
        }
        
        console.log(`Loaded ${posts.length} posts and ${tradeOffers.length} trade offers`);
    } catch (error) {
        console.error('Error loading community data:', error);
        posts = [];
        tradeOffers = [];
    }
}

// Clear template content
function clearTemplateContent() {
    if (postsContainer) {
        postsContainer.innerHTML = '';
    }
    
    if (tradeOffersContainer) {
        // Keep only the "Add Trade Offer" button
        const addOfferBtn = document.querySelector('#trade-offers-container .text-center');
        if (tradeOffersContainer && addOfferBtn) {
            tradeOffersContainer.innerHTML = '';
            tradeOffersContainer.appendChild(addOfferBtn);
        }
    }
}

// Render posts
function renderPosts() {
    if (!postsContainer) return;
    
    if (posts.length === 0) {
        postsContainer.innerHTML = `
            <div class="text-center p-5">
                <p class="text-muted">No posts yet. Be the first to start a discussion!</p>
            </div>
        `;
        return;
    }
    
    // Clear container
    postsContainer.innerHTML = '';
    
    // Sort posts by date (newest first)
    const sortedPosts = [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Render each post
    sortedPosts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'post-item';
        postElement.dataset.postId = post.id;
        
        const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'owner');
        const adminControls = isAdmin ? `
            <div class="admin-controls">
                <button class="btn btn-sm btn-danger delete-post-btn" 
                        onclick="deletePost('${post.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        ` : '';
        
        postElement.innerHTML = `
            <div class="post-header">
                <div class="post-user">
                    <i class="fas fa-user-circle"></i>
                    <span class="username">${post.author}</span>
                </div>
                <div class="post-info">
                    <div class="post-date">${formatDate(post.date)}</div>
                    ${adminControls}
                </div>
            </div>
            <div class="post-content">
                <h4>${post.title}</h4>
                <p>${post.content}</p>
            </div>
            <div class="post-footer">
                <button class="btn btn-sm btn-outline-primary reply-btn">
                    <i class="fas fa-reply"></i> Reply
                </button>
                <span class="comments-count">${post.comments.length} ${post.comments.length === 1 ? 'reply' : 'replies'}</span>
            </div>
            <div class="comments-container" style="display: none;">
                ${renderComments(post.comments)}
                <div class="comment-form">
                    <textarea class="form-control mb-2 comment-input" placeholder="Write a reply..."></textarea>
                    <button class="btn btn-sm btn-primary post-comment-btn" data-post-id="${post.id}">Post Reply</button>
                </div>
            </div>
        `;
        
        postsContainer.appendChild(postElement);
    });
    
    // Add event listeners for reply buttons
    initializeReplyButtons();
    
    // Add event listeners for comment buttons
    initializeCommentButtons();
}

// Render comments for a post
function renderComments(comments) {
    if (comments.length === 0) {
        return '<p class="text-muted text-center">No replies yet. Be the first to reply!</p>';
    }
    
    return comments.map(comment => `
        <div class="comment-item">
            <div class="comment-header">
                <div class="comment-user">
                    <i class="fas fa-user-circle"></i>
                    <span class="username">${comment.author}</span>
                </div>
                <div class="comment-date">${formatDate(comment.date)}</div>
            </div>
            <div class="comment-content">
                <p>${comment.content}</p>
            </div>
        </div>
    `).join('');
}

// Render trade offers
function renderTradeOffers() {
    if (!tradeOffersContainer) return;
    
    // Get the Add Trade Offer button container
    const addTradeBtn = document.querySelector('#trade-offers-container .text-center');
    if (!addTradeBtn) return;
    
    // Clear container except for the add button
    tradeOffersContainer.innerHTML = '';
    
    if (tradeOffers.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'text-center p-3';
        emptyMessage.innerHTML = '<p class="text-muted">No trade offers yet. Add one to get started!</p>';
        tradeOffersContainer.appendChild(emptyMessage);
    } else {
        // Render each trade offer
        tradeOffers.forEach(offer => {
            const offerElement = document.createElement('div');
            offerElement.className = 'trade-offer';
            offerElement.dataset.offerId = offer.id;
            
            offerElement.innerHTML = `
                <div class="trade-user">
                    <i class="fas fa-user-circle"></i>
                    <span>${offer.author}</span>
                </div>
                <div class="trade-details">
                    <div class="trade-item">
                        <span class="offer-label">Offering:</span>
                        <span class="offer-value">${offer.offering}</span>
                    </div>
                    <div class="trade-item">
                        <span class="looking-label">Looking for:</span>
                        <span class="looking-value">${offer.lookingFor}</span>
                    </div>
                </div>
                <div class="d-flex justify-content-between mt-2">
                    <button class="btn btn-sm btn-outline-primary contact-btn" data-offer-id="${offer.id}">
                        Contact
                    </button>
                    ${currentUser && (currentUser.role === 'admin' || currentUser.role === 'owner' || 
                      (currentUser.id === offer.userId)) ? 
                        `<button class="btn btn-sm btn-outline-danger delete-offer-btn" data-offer-id="${offer.id}">
                            <i class="fas fa-trash"></i>
                        </button>` : 
                        ''}
                </div>
            `;
            
            tradeOffersContainer.appendChild(offerElement);
        });
    }
    
    // Add the button back
    tradeOffersContainer.appendChild(addTradeBtn);
    
    // Initialize contact buttons
    initializeContactButtons();
    
    // Initialize delete offer buttons
    initializeDeleteOfferButtons();
}

// Setup event listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // New post modal
    if (newPostBtn) {
        console.log('New post button found');
        newPostBtn.addEventListener('click', showNewPostModal);
    }
    
    if (closePostModal) {
        closePostModal.addEventListener('click', hideNewPostModal);
    }
    
    if (cancelPostBtn) {
        cancelPostBtn.addEventListener('click', hideNewPostModal);
    }
    
    if (newPostForm) {
        newPostForm.addEventListener('submit', handleNewPost);
    }
    
    // Trade offer modal
    if (addTradeOfferBtn) {
        console.log('Add trade offer button found');
        addTradeOfferBtn.addEventListener('click', showAddTradeModal);
    }
    
    if (closeTradeModal) {
        closeTradeModal.addEventListener('click', hideAddTradeModal);
    }
    
    if (cancelTradeBtn) {
        cancelTradeBtn.addEventListener('click', hideAddTradeModal);
    }
    
    if (newTradeForm) {
        newTradeForm.addEventListener('submit', handleNewTradeOffer);
    }
    
    // Global click handler for dynamically added elements
    document.addEventListener('click', function(event) {
        // Handle pagination clicks
        if (event.target.closest('.page-link')) {
            const pageLink = event.target.closest('.page-link');
            const pageNum = pageLink.textContent;
            
            if (pageNum === 'Previous' || pageNum === 'Next') {
                // Handle previous/next
                console.log('Pagination:', pageNum);
            } else {
                // Handle specific page
                console.log('Go to page:', pageNum);
            }
        }
        
        // Handle delete post buttons
        if (event.target.closest('.delete-post-btn')) {
            const postId = event.target.closest('.post-item').dataset.postId;
            deletePost(postId);
        }
    });
}

// Initialize reply buttons
function initializeReplyButtons() {
    const replyButtons = document.querySelectorAll('.reply-btn');
    
    replyButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Get the comments container for this post
            const postItem = this.closest('.post-item');
            const commentsContainer = postItem.querySelector('.comments-container');
            
            // Toggle comments visibility
            if (commentsContainer.style.display === 'block') {
                commentsContainer.style.display = 'none';
            } else {
                commentsContainer.style.display = 'block';
            }
        });
    });
    
    console.log(`Initialized ${replyButtons.length} reply buttons`);
}

// Initialize comment buttons
function initializeCommentButtons() {
    const commentButtons = document.querySelectorAll('.post-comment-btn');
    
    commentButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (!currentUser) {
                showLoginPrompt();
                return;
            }
            
            const postId = this.dataset.postId;
            const commentInput = this.previousElementSibling;
            const content = commentInput.value.trim();
            
            if (!content) {
                showAlert('Please enter a comment', 'warning');
                return;
            }
            
            addComment(postId, content);
            commentInput.value = '';
        });
    });
    
    console.log(`Initialized ${commentButtons.length} comment buttons`);
}

// Initialize contact buttons
function initializeContactButtons() {
    const contactButtons = document.querySelectorAll('.contact-btn');
    
    contactButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (!currentUser) {
                showLoginPrompt();
                return;
            }
            
            const offerId = this.dataset.offerId;
            const offer = tradeOffers.find(o => o.id === offerId);
            
            if (offer) {
                showAlert(`Contact request sent to ${offer.author}. They will be notified of your interest.`, 'success');
            }
        });
    });
    
    console.log(`Initialized ${contactButtons.length} contact buttons`);
}

// Initialize delete offer buttons
function initializeDeleteOfferButtons() {
    const deleteButtons = document.querySelectorAll('.delete-offer-btn');
    
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const offerId = this.dataset.offerId;
            deleteTradeOffer(offerId);
        });
    });
    
    console.log(`Initialized ${deleteButtons.length} delete offer buttons`);
}

// Show new post modal
function showNewPostModal() {
    if (!currentUser) {
        showLoginPrompt();
        return;
    }
    
    console.log('Showing new post modal');
    newPostModal.classList.add('show');
}

// Hide new post modal
function hideNewPostModal() {
    console.log('Hiding new post modal');
    newPostModal.classList.remove('show');
    newPostForm.reset();
}

// Show add trade modal
function showAddTradeModal() {
    if (!currentUser) {
        showLoginPrompt();
        return;
    }
    
    console.log('Showing add trade modal');
    addTradeModal.classList.add('show');
}

// Hide add trade modal
function hideAddTradeModal() {
    console.log('Hiding add trade modal');
    addTradeModal.classList.remove('show');
    newTradeForm.reset();
}

// Show login prompt
function showLoginPrompt() {
    showAlert('You need to be logged in to perform this action. Please log in or create an account.', 'warning');
    
    // Redirect to login page after a short delay
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 2000);
}

// Handle new post submission
function handleNewPost(event) {
    event.preventDefault();
    
    if (!currentUser) {
        showLoginPrompt();
        return;
    }
    
    const title = document.getElementById('post-title').value.trim();
    const content = document.getElementById('post-content').value.trim();
    
    if (!title || !content) {
        showAlert('Please fill in all fields', 'warning');
        return;
    }
    
    // Create new post object
    const newPost = {
        id: Date.now().toString(),
        title: title,
        content: content,
        author: currentUser.username || currentUser.email.split('@')[0],
        userId: currentUser.id,
        date: new Date().toISOString(),
        comments: []
    };
    
    // Add to posts array
    posts.push(newPost);
    
    // Save to localStorage
    localStorage.setItem('community_posts', JSON.stringify(posts));
    
    // Re-render posts
    renderPosts();
    
    // Hide the modal and reset the form
    hideNewPostModal();
    
    // Show success message
    showAlert('Post created successfully', 'success');
    console.log('New post created:', newPost.id);
}

// Add a comment to a post
function addComment(postId, content) {
    // Find post
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) {
        showAlert('Post not found', 'danger');
        return;
    }
    
    // Create comment object
    const newComment = {
        id: Date.now().toString(),
        content: content,
        author: currentUser.username || currentUser.email.split('@')[0],
        userId: currentUser.id,
        date: new Date().toISOString()
    };
    
    // Add comment to post
    posts[postIndex].comments.push(newComment);
    
    // Save to localStorage
    localStorage.setItem('community_posts', JSON.stringify(posts));
    
    // Re-render posts
    renderPosts();
    
    // Show success message
    showAlert('Reply posted successfully', 'success');
    console.log('New comment added to post:', postId);
    
    // Keep comments section open
    const postElement = document.querySelector(`.post-item[data-post-id="${postId}"]`);
    if (postElement) {
        const commentsContainer = postElement.querySelector('.comments-container');
        if (commentsContainer) {
            commentsContainer.style.display = 'block';
        }
    }
}

// Delete a post
function deletePost(postId) {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
        return;
    }
    
    // Find post index
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) {
        showAlert('Post not found', 'danger');
        return;
    }
    
    // Remove post
    posts.splice(postIndex, 1);
    
    // Save to localStorage
    localStorage.setItem('community_posts', JSON.stringify(posts));
    
    // Re-render posts
    renderPosts();
    
    // Show success message
    showAlert('Post deleted successfully', 'success');
    console.log('Post deleted:', postId);
}

// Handle new trade offer submission
function handleNewTradeOffer(event) {
    event.preventDefault();
    
    if (!currentUser) {
        showLoginPrompt();
        return;
    }
    
    const offering = document.getElementById('offering').value.trim();
    const lookingFor = document.getElementById('looking-for').value.trim();
    
    if (!offering || !lookingFor) {
        showAlert('Please fill in all fields', 'warning');
        return;
    }
    
    // Create new trade offer object
    const newTradeOffer = {
        id: Date.now().toString(),
        offering: offering,
        lookingFor: lookingFor,
        author: currentUser.username || currentUser.email.split('@')[0],
        userId: currentUser.id,
        date: new Date().toISOString()
    };
    
    // Add to trade offers array
    tradeOffers.push(newTradeOffer);
    
    // Save to localStorage
    localStorage.setItem('community_tradeOffers', JSON.stringify(tradeOffers));
    
    // Re-render trade offers
    renderTradeOffers();
    
    // Hide the modal and reset the form
    hideAddTradeModal();
    
    // Show success message
    showAlert('Trade offer added successfully', 'success');
    console.log('New trade offer created:', newTradeOffer.id);
}

// Delete a trade offer
function deleteTradeOffer(offerId) {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this trade offer? This action cannot be undone.')) {
        return;
    }
    
    // Find offer index
    const offerIndex = tradeOffers.findIndex(o => o.id === offerId);
    if (offerIndex === -1) {
        showAlert('Trade offer not found', 'danger');
        return;
    }
    
    // Remove offer
    tradeOffers.splice(offerIndex, 1);
    
    // Save to localStorage
    localStorage.setItem('community_tradeOffers', JSON.stringify(tradeOffers));
    
    // Re-render trade offers
    renderTradeOffers();
    
    // Show success message
    showAlert('Trade offer deleted successfully', 'success');
    console.log('Trade offer deleted:', offerId);
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSecs < 60) {
        return 'Just now';
    } else if (diffMins < 60) {
        return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHours < 24) {
        return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDays < 7) {
        return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    } else {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }
}

// Show alert message
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
    
    console.log('Alert shown:', message);
}

// Global form submit handlers
function submitNewPost(event) {
    console.log('submitNewPost called');
    event.preventDefault();
    
    // Check if user is logged in
    const userJson = localStorage.getItem('currentUser');
    let currentUser = null;
    if (userJson) {
        try {
            currentUser = JSON.parse(userJson);
        } catch (error) {
            console.error('Error parsing user data:', error);
        }
    }
    
    if (!currentUser) {
        // Redirect to login
        alert('Please log in to create a post');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
        return;
    }
    
    const title = document.getElementById('post-title').value.trim();
    const content = document.getElementById('post-content').value.trim();
    
    if (!title || !content) {
        alert('Please fill in all fields');
        return;
    }
    
    // Create new post object
    const newPost = {
        id: Date.now().toString(),
        title: title,
        content: content,
        author: currentUser.username || currentUser.email.split('@')[0],
        userId: currentUser.id,
        date: new Date().toISOString(),
        comments: []
    };
    
    // Load existing posts
    let posts = [];
    try {
        const savedPosts = localStorage.getItem('community_posts');
        if (savedPosts) {
            posts = JSON.parse(savedPosts);
        }
    } catch (error) {
        console.error('Error loading posts:', error);
    }
    
    // Add to posts array
    posts.push(newPost);
    
    // Save to localStorage
    localStorage.setItem('community_posts', JSON.stringify(posts));
    
    // Hide the modal
    document.getElementById('new-post-modal').classList.remove('show');
    
    // Show success message
    alert('Post created successfully');
    
    // Reload the page to show the new post
    location.reload();
}

function submitTradeOffer(event) {
    console.log('submitTradeOffer called');
    event.preventDefault();
    
    // Check if user is logged in
    const userJson = localStorage.getItem('currentUser');
    let currentUser = null;
    if (userJson) {
        try {
            currentUser = JSON.parse(userJson);
        } catch (error) {
            console.error('Error parsing user data:', error);
        }
    }
    
    if (!currentUser) {
        // Redirect to login
        alert('Please log in to create a trade offer');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
        return;
    }
    
    const offering = document.getElementById('offering').value.trim();
    const lookingFor = document.getElementById('looking-for').value.trim();
    
    if (!offering || !lookingFor) {
        alert('Please fill in all fields');
        return;
    }
    
    // Create new trade offer object
    const newTradeOffer = {
        id: Date.now().toString(),
        offering: offering,
        lookingFor: lookingFor,
        author: currentUser.username || currentUser.email.split('@')[0],
        userId: currentUser.id,
        date: new Date().toISOString()
    };
    
    // Load existing trade offers
    let tradeOffers = [];
    try {
        const savedTradeOffers = localStorage.getItem('community_tradeOffers');
        if (savedTradeOffers) {
            tradeOffers = JSON.parse(savedTradeOffers);
        }
    } catch (error) {
        console.error('Error loading trade offers:', error);
    }
    
    // Add to trade offers array
    tradeOffers.push(newTradeOffer);
    
    // Save to localStorage
    localStorage.setItem('community_tradeOffers', JSON.stringify(tradeOffers));
    
    // Hide the modal
    document.getElementById('add-trade-modal').classList.remove('show');
    
    // Show success message
    alert('Trade offer added successfully');
    
    // Reload the page to show the new trade offer
    location.reload();
}