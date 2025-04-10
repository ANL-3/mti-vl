// Admin Panel Module
// Handles admin panel functionality for managing vehicles, users, and content

// Initialize admin panel when document is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin panel initializing...');
    initAdminPanel();
});

// Initialize admin panel
function initAdminPanel() {
    // Check if user is an admin
    checkAdminAndLoad();

    // Set up event listeners for admin actions
    document.getElementById('add-vehicle-btn')?.addEventListener('click', function() {
        document.getElementById('add-vehicle-modal').style.display = 'flex';
    });

    document.getElementById('cancel-add-vehicle')?.addEventListener('click', function() {
        document.getElementById('add-vehicle-modal').style.display = 'none';
    });

    document.getElementById('add-vehicle-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        addVehicle();
    });

    document.getElementById('cancel-edit-vehicle')?.addEventListener('click', function() {
        document.getElementById('edit-vehicle-modal').style.display = 'none';
    });

    document.getElementById('edit-vehicle-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        updateVehicle();
    });

    // Filter event listeners
    document.getElementById('vehicle-search')?.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        filterTable('vehicles-table-body', searchTerm);
    });

    document.getElementById('user-search')?.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        filterTable('users-table-body', searchTerm);
    });
}

// Check if the current user is an admin and load content accordingly
function checkAdminAndLoad() {
    // Try to get the current user from localStorage
    const userJson = localStorage.getItem('currentUser');
    console.log('Checking admin access - User data:', userJson);

    if (userJson) {
        try {
            const user = JSON.parse(userJson);
            console.log('Parsed user data:', user);

            // Check if user is admin, owner, or has owner email
            const hasAccess = user.role === 'admin' || user.role === 'owner' || user.email === 'aero81710@gmail.com';
            console.log('Access check result:', hasAccess);

            if (hasAccess) {
                console.log('Admin access granted');

                // Show admin content and hide access denied message
                document.getElementById('admin-content').style.display = 'block';
                document.getElementById('admin-access-denied').style.display = 'none';

                // Load admin data
                loadVehiclesForAdmin();
                loadUsersForAdmin();
                loadContentForModeration();
                updateDashboardStats();

                return;
            }
        } catch (error) {
            console.error('Error parsing user data:', error);
        }
    }

    // If we get here, user is not an admin
    console.log('Admin access denied');
    showAccessDenied();
}

// Show access denied message and hide admin content
function showAccessDenied() {
    document.getElementById('admin-content').style.display = 'none';
    document.getElementById('admin-access-denied').style.display = 'block';
}

// Load vehicles for admin panel
function loadVehiclesForAdmin() {
    console.log('Loading vehicles for admin panel...');

    // Get vehicles from localStorage
    try {
        const vehiclesJson = localStorage.getItem('vehicles');

        if (vehiclesJson) {
            const vehicles = JSON.parse(vehiclesJson);
            console.log(`Loaded ${vehicles.length} vehicles`);

            // Display vehicles in admin table
            displayVehiclesForAdmin(vehicles);

            // Update vehicle count in dashboard
            document.getElementById('total-vehicles').textContent = vehicles.length;
        } else {
            // No vehicles found
            document.getElementById('vehicles-table-body').innerHTML = '<tr><td colspan="7" class="text-center">No vehicles found.</td></tr>';
            document.getElementById('total-vehicles').textContent = '0';
        }
    } catch (error) {
        console.error('Error loading vehicles:', error);
        document.getElementById('vehicles-table-body').innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error loading vehicles.</td></tr>';
    }
}

// Display vehicles in admin table
function displayVehiclesForAdmin(vehicles) {
    const tableBody = document.getElementById('vehicles-table-body');
    tableBody.innerHTML = '';

    vehicles.forEach(vehicle => {
        const row = document.createElement('tr');
        row.dataset.id = vehicle.id;

        // Get default image if none provided
        const imageUrl = vehicle.imageUrl || getDefaultImageForType(vehicle.type);

        row.innerHTML = `
            <td><img src="${imageUrl}" alt="${vehicle.name}" width="60" height="40" class="vehicle-thumbnail"></td>
            <td>${vehicle.name}</td>
            <td>${capitalizeFirst(vehicle.type)}</td>
            <td>${vehicle.value}</td>
            <td>${vehicle.demand}</td>
            <td>${capitalizeFirst(vehicle.trend)}</td>
            <td class="action-buttons">
                <button class="btn btn-sm btn-primary" onclick="openEditVehicleModal('${vehicle.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteVehicle('${vehicle.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

// Load users for admin panel
function loadUsersForAdmin() {
    console.log('Loading users for admin panel...');

    // Get users from localStorage
    try {
        const usersJson = localStorage.getItem('users');

        if (usersJson) {
            const users = JSON.parse(usersJson);
            console.log(`Loaded ${users.length} users`);

            // Display users in admin table
            displayUsersForAdmin(users);

            // Update user count in dashboard
            document.getElementById('total-users').textContent = users.length;
        } else {
            // No users found
            document.getElementById('users-table-body').innerHTML = '<tr><td colspan="5" class="text-center">No users found.</td></tr>';
            document.getElementById('total-users').textContent = '0';
        }
    } catch (error) {
        console.error('Error loading users:', error);
        document.getElementById('users-table-body').innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading users.</td></tr>';
    }
}

// Display users in admin table
function displayUsersForAdmin(users) {
    const tableBody = document.getElementById('users-table-body');
    tableBody.innerHTML = '';

    users.forEach(user => {
        const row = document.createElement('tr');
        row.dataset.id = user.id;

        // Determine user role and badge
        const role = user.role || 'user';
        const roleBadge = `<span class="user-badge ${role}">${capitalizeFirst(role)}</span>`;

        // Format joined date
        const joinedDate = user.createdAt ? formatTimestamp(user.createdAt) : 'N/A';

        // Determine action buttons based on role
        let actionButtons = '';

        // If user is not already an admin, show "Make Admin" button
        if (role !== 'admin' && role !== 'owner') {
            actionButtons += `<button class="btn btn-sm btn-primary" onclick="makeUserAdmin('${user.id}')">Make Admin</button>`;
        } 
        // If user is an admin but not an owner, show "Remove Admin" button
        else if (role === 'admin') {
            actionButtons += `<button class="btn btn-sm btn-warning" onclick="removeUserAdmin('${user.id}')">Remove Admin</button>`;
        }

        row.innerHTML = `
            <td>${user.username || 'N/A'}</td>
            <td>${user.email}</td>
            <td>${roleBadge}</td>
            <td>${joinedDate}</td>
            <td class="action-buttons">
                ${actionButtons}
            </td>
        `;

        tableBody.appendChild(row);
    });
}

// Load posts and trade offers for moderation
function loadContentForModeration() {
    console.log('Loading content for moderation...');

    // Load community posts
    try {
        const postsJson = localStorage.getItem('community_posts');

        if (postsJson) {
            const posts = JSON.parse(postsJson);
            console.log(`Loaded ${posts.length} posts for moderation`);

            // Display posts in moderation table
            displayPostsForModeration(posts);

            // Update post count in dashboard
            document.getElementById('total-posts').textContent = posts.length;
        } else {
            // No posts found
            document.getElementById('posts-table-body').innerHTML = '<tr><td colspan="5" class="text-center">No posts found.</td></tr>';
            document.getElementById('total-posts').textContent = '0';
        }
    } catch (error) {
        console.error('Error loading posts:', error);
    }

    // Load trade offers
    try {
        const offersJson = localStorage.getItem('community_tradeOffers');

        if (offersJson) {
            const offers = JSON.parse(offersJson);
            console.log(`Loaded ${offers.length} trade offers for moderation`);

            // Display trade offers in moderation table
            displayTradeOffersForModeration(offers);

            // Update trade offer count in dashboard
            document.getElementById('total-trades').textContent = offers.length;
        } else {
            // No trade offers found
            document.getElementById('trade-offers-table-body').innerHTML = '<tr><td colspan="5" class="text-center">No trade offers found.</td></tr>';
            document.getElementById('total-trades').textContent = '0';
        }
    } catch (error) {
        console.error('Error loading trade offers:', error);
    }
}

// Display posts for moderation
function displayPostsForModeration(posts) {
    const tableBody = document.getElementById('posts-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    // Sort posts by date (newest first)
    const sortedPosts = [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedPosts.forEach(post => {
        const row = document.createElement('tr');
        row.dataset.id = post.id;

        // Format date
        const date = formatTimestamp(post.date);

        // Count replies
        const replyCount = post.comments ? post.comments.length : 0;

        row.innerHTML = `
            <td class="truncate-text">${post.title}</td>
            <td>${post.author}</td>
            <td>${date}</td>
            <td>${replyCount}</td>
            <td class="action-buttons">
                <button class="btn btn-sm btn-danger" onclick="deletePost('${post.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

// Display trade offers for moderation
function displayTradeOffersForModeration(offers) {
    const tableBody = document.getElementById('trade-offers-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    // Sort offers by date (newest first)
    const sortedOffers = [...offers].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedOffers.forEach(offer => {
        const row = document.createElement('tr');
        row.dataset.id = offer.id;

        // Format date
        const date = formatTimestamp(offer.date);

        row.innerHTML = `
            <td>${offer.author}</td>
            <td class="truncate-text">${offer.offering}</td>
            <td class="truncate-text">${offer.lookingFor}</td>
            <td>${date}</td>
            <td class="action-buttons">
                <button class="btn btn-sm btn-danger" onclick="deleteTradeOffer('${offer.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

// Update dashboard statistics
function updateDashboardStats() {
    // Most statistics are updated when loading the respective content
    // This function can be extended for additional dashboard stats
    console.log('Updating dashboard statistics...');
}

// Add a new vehicle
function addVehicle() {
    // Get values from form
    const name = document.getElementById('vehicle-name').value;
    const type = document.getElementById('vehicle-type').value;
    const imageUrl = document.getElementById('vehicle-image').value;
    const value = parseInt(document.getElementById('vehicle-value').value);
    const demand = parseInt(document.getElementById('vehicle-demand').value);
    const rarity = parseInt(document.getElementById('vehicle-rarity').value);
    const trend = document.getElementById('vehicle-trend').value;
    const functionality = parseInt(document.getElementById('vehicle-functionality').value);

    // Create vehicle object
    const newVehicle = {
        id: Date.now().toString(),
        name: name,
        type: type,
        imageUrl: imageUrl,
        value: value,
        demand: demand,
        rarity: rarity,
        trend: trend,
        functionality: functionality,
        addedAt: new Date().toISOString()
    };

    // Get current vehicles
    try {
        let vehicles = [];
        const vehiclesJson = localStorage.getItem('vehicles');

        if (vehiclesJson) {
            vehicles = JSON.parse(vehiclesJson);
        }

        // Add new vehicle
        vehicles.push(newVehicle);

        // Save to localStorage
        localStorage.setItem('vehicles', JSON.stringify(vehicles));

        // Hide modal and reset form
        document.getElementById('add-vehicle-modal').style.display = 'none';
        document.getElementById('add-vehicle-form').reset();

        // Reload vehicles
        loadVehiclesForAdmin();

        // Show success message
        showAlert('Vehicle added successfully!', 'success');
    } catch (error) {
        console.error('Error adding vehicle:', error);
        showAlert('Error adding vehicle. Please try again.', 'danger');
    }
}

// Open edit vehicle modal
function openEditVehicleModal(vehicleId) {
    console.log('Opening edit modal for vehicle:', vehicleId);

    // Find the vehicle
    try {
        const vehiclesJson = localStorage.getItem('vehicles');

        if (vehiclesJson) {
            const vehicles = JSON.parse(vehiclesJson);
            const vehicle = vehicles.find(v => v.id === vehicleId);

            if (vehicle) {
                // Populate form fields
                document.getElementById('edit-vehicle-id').value = vehicle.id;
                document.getElementById('edit-vehicle-name').value = vehicle.name;
                document.getElementById('edit-vehicle-type').value = vehicle.type;
                document.getElementById('edit-vehicle-image').value = vehicle.imageUrl || '';
                document.getElementById('edit-vehicle-value').value = vehicle.value;
                document.getElementById('edit-vehicle-demand').value = vehicle.demand;
                document.getElementById('edit-vehicle-rarity').value = vehicle.rarity;
                document.getElementById('edit-vehicle-trend').value = vehicle.trend;
                document.getElementById('edit-vehicle-functionality').value = vehicle.functionality;

                // Show modal
                document.getElementById('edit-vehicle-modal').style.display = 'flex';
            } else {
                showAlert('Vehicle not found!', 'danger');
            }
        }
    } catch (error) {
        console.error('Error opening edit modal:', error);
        showAlert('Error loading vehicle data.', 'danger');
    }
}

// Hide edit vehicle modal
function hideEditVehicleModal() {
    document.getElementById('edit-vehicle-modal').style.display = 'none';
}

// Update vehicle
function updateVehicle() {
    // Get values from form
    const id = document.getElementById('edit-vehicle-id').value;
    const name = document.getElementById('edit-vehicle-name').value;
    const type = document.getElementById('edit-vehicle-type').value;
    const imageUrl = document.getElementById('edit-vehicle-image').value;
    const value = parseInt(document.getElementById('edit-vehicle-value').value);
    const demand = parseInt(document.getElementById('edit-vehicle-demand').value);
    const rarity = parseInt(document.getElementById('edit-vehicle-rarity').value);
    const trend = document.getElementById('edit-vehicle-trend').value;
    const functionality = parseInt(document.getElementById('edit-vehicle-functionality').value);

    // Get current vehicles
    try {
        const vehiclesJson = localStorage.getItem('vehicles');

        if (vehiclesJson) {
            const vehicles = JSON.parse(vehiclesJson);

            // Find index of vehicle to update
            const index = vehicles.findIndex(v => v.id === id);

            if (index !== -1) {
                // Create updated vehicle object
                const updatedVehicle = {
                    ...vehicles[index],
                    name: name,
                    type: type,
                    imageUrl: imageUrl,
                    value: value,
                    demand: demand,
                    rarity: rarity,
                    trend: trend,
                    functionality: functionality,
                    updatedAt: new Date().toISOString()
                };

                // Update vehicle in array
                vehicles[index] = updatedVehicle;

                // Save to localStorage
                localStorage.setItem('vehicles', JSON.stringify(vehicles));

                // Hide modal
                hideEditVehicleModal();

                // Reload vehicles
                loadVehiclesForAdmin();

                // Show success message
                showAlert('Vehicle updated successfully!', 'success');
            } else {
                showAlert('Vehicle not found!', 'danger');
            }
        }
    } catch (error) {
        console.error('Error updating vehicle:', error);
        showAlert('Error updating vehicle. Please try again.', 'danger');
    }
}

// Delete vehicle
function deleteVehicle(vehicleId) {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this vehicle?')) {
        return;
    }

    // Get current vehicles
    try {
        const vehiclesJson = localStorage.getItem('vehicles');

        if (vehiclesJson) {
            const vehicles = JSON.parse(vehiclesJson);

            // Filter out the vehicle to delete
            const updatedVehicles = vehicles.filter(v => v.id !== vehicleId);

            // Save to localStorage
            localStorage.setItem('vehicles', JSON.stringify(updatedVehicles));

            // Reload vehicles
            loadVehiclesForAdmin();

            // Update vehicle count in dashboard
            document.getElementById('total-vehicles').textContent = updatedVehicles.length;

            // Show success message
            showAlert('Vehicle deleted successfully!', 'success');
        }
    } catch (error) {
        console.error('Error deleting vehicle:', error);
        showAlert('Error deleting vehicle. Please try again.', 'danger');
    }
}

// Delete a post
function deletePost(postId) {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this post?')) {
        return;
    }

    // Get current posts
    try {
        const postsJson = localStorage.getItem('community_posts');

        if (postsJson) {
            const posts = JSON.parse(postsJson);

            // Filter out the post to delete
            const updatedPosts = posts.filter(p => p.id !== postId);

            // Save to localStorage
            localStorage.setItem('community_posts', JSON.stringify(updatedPosts));

            // Reload content for moderation
            loadContentForModeration();

            // Show success message
            showAlert('Post deleted successfully!', 'success');
        }
    } catch (error) {
        console.error('Error deleting post:', error);
        showAlert('Error deleting post. Please try again.', 'danger');
    }
}

// Delete a trade offer
function deleteTradeOffer(offerId) {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this trade offer?')) {
        return;
    }

    // Get current trade offers
    try {
        const offersJson = localStorage.getItem('community_tradeOffers');

        if (offersJson) {
            const offers = JSON.parse(offersJson);

            // Filter out the offer to delete
            const updatedOffers = offers.filter(o => o.id !== offerId);

            // Save to localStorage
            localStorage.setItem('community_tradeOffers', JSON.stringify(updatedOffers));

            // Reload content for moderation
            loadContentForModeration();

            // Show success message
            showAlert('Trade offer deleted successfully!', 'success');
        }
    } catch (error) {
        console.error('Error deleting trade offer:', error);
        showAlert('Error deleting trade offer. Please try again.', 'danger');
    }
}

// Make a user an admin
function makeUserAdmin(userId) {
    // Confirm action
    if (!confirm('Are you sure you want to make this user an admin?')) {
        return;
    }

    // Get current users
    try {
        const usersJson = localStorage.getItem('users');

        if (usersJson) {
            const users = JSON.parse(usersJson);

            // Find user to update
            const index = users.findIndex(u => u.id === userId);

            if (index !== -1) {
                // Update user role
                users[index].role = 'admin';

                // Save to localStorage
                localStorage.setItem('users', JSON.stringify(users));

                // Reload users
                loadUsersForAdmin();

                // Show success message
                showAlert('User promoted to admin successfully!', 'success');
            } else {
                showAlert('User not found!', 'danger');
            }
        }
    } catch (error) {
        console.error('Error updating user role:', error);
        showAlert('Error updating user role. Please try again.', 'danger');
    }
}

// Remove admin privileges from a user
function removeUserAdmin(userId) {
    // Confirm action
    if (!confirm('Are you sure you want to remove admin privileges from this user?')) {
        return;
    }

    // Get current users
    try {
        const usersJson = localStorage.getItem('users');

        if (usersJson) {
            const users = JSON.parse(usersJson);

            // Find user to update
            const index = users.findIndex(u => u.id === userId);

            if (index !== -1) {
                // Update user role
                users[index].role = 'user';

                // Save to localStorage
                localStorage.setItem('users', JSON.stringify(users));

                // Reload users
                loadUsersForAdmin();

                // Show success message
                showAlert('Admin privileges removed successfully!', 'success');
            } else {
                showAlert('User not found!', 'danger');
            }
        }
    } catch (error) {
        console.error('Error updating user role:', error);
        showAlert('Error updating user role. Please try again.', 'danger');
    }
}

// Filter table rows based on search term
function filterTable(tableBodyId, searchTerm) {
    const rows = document.querySelectorAll(`#${tableBodyId} tr`);

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Capitalize first letter of a string
function capitalizeFirst(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Format timestamp for display
function formatTimestamp(timestamp) {
    try {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Error formatting timestamp:', error);
        return 'Invalid date';
    }
}

// Get default image for a vehicle type
function getDefaultImageForType(type) {
    const defaultImages = {
        car: 'https://via.placeholder.com/60x40/3498db/ffffff?text=Car',
        truck: 'https://via.placeholder.com/60x40/2ecc71/ffffff?text=Truck',
        tank: 'https://via.placeholder.com/60x40/e74c3c/ffffff?text=Tank',
        helicopter: 'https://via.placeholder.com/60x40/9b59b6/ffffff?text=Heli',
        plane: 'https://via.placeholder.com/60x40/f39c12/ffffff?text=Plane',
        boat: 'https://via.placeholder.com/60x40/1abc9c/ffffff?text=Boat',
        default: 'https://via.placeholder.com/60x40/95a5a6/ffffff?text=Vehicle'
    };

    return defaultImages[type] || defaultImages.default;
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