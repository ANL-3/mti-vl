// Admin Module
// Handles admin panel functionality

// Collection references
const usersRef = db.collection('users');
const vehiclesRef = db.collection('vehicles');
const adsRef = db.collection('tradingAds');

// DOM Elements
const adminContainer = document.getElementById('admin-container');
const vehicleTable = document.getElementById('vehicle-table');
const vehicleTableBody = document.getElementById('vehicle-table-body');
const userTable = document.getElementById('user-table');
const userTableBody = document.getElementById('user-table-body');
const addVehicleForm = document.getElementById('add-vehicle-form');
const editVehicleForm = document.getElementById('edit-vehicle-form');
const editVehicleModal = document.getElementById('edit-vehicle-modal');
const closeEditVehicleModal = document.getElementById('close-edit-vehicle-modal');

// Check if user is admin and load admin content
function checkAdminAndLoad() {
    if (!adminContainer) return;
    
    // Show loading state
    adminContainer.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-3">Checking permissions...</p>
        </div>
    `;
    
    // Check if user is actually logged in first
    if (!auth.currentUser) {
        adminContainer.innerHTML = `
            <div class="alert alert-warning text-center">
                <i class="fas fa-exclamation-triangle"></i>
                <h4>Authentication Required</h4>
                <p>You must be logged in as an admin to access this page.</p>
                <a href="login.html" class="btn btn-primary mt-3">Login</a>
            </div>
        `;
        return;
    }
    
    // Check admin permissions using our function from auth.js
    isAdmin().then(isAdminUser => {
        if (isAdminUser) {
            // User is admin, load admin content
            adminContainer.innerHTML = document.getElementById('admin-content-template').innerHTML;
            
            // Initialize admin components
            initAdminComponents();
            
            // Also check if user is owner to show owner-specific content
            isOwner().then(isOwnerUser => {
                if (isOwnerUser) {
                    const ownerOnlyElements = document.querySelectorAll('.owner-only');
                    ownerOnlyElements.forEach(el => {
                        el.style.display = 'block';
                    });
                }
            });
        } else {
            // User is not admin, show access denied
            adminContainer.innerHTML = `
                <div class="alert alert-danger text-center">
                    <i class="fas fa-exclamation-circle"></i>
                    <h4>Access Denied</h4>
                    <p>You do not have permission to access the admin panel.</p>
                    <a href="../index.html" class="btn btn-primary mt-3">Back to Homepage</a>
                </div>
            `;
        }
    }).catch(error => {
        console.error("Error checking admin status:", error);
        adminContainer.innerHTML = `
            <div class="alert alert-danger text-center">
                <i class="fas fa-exclamation-circle"></i>
                <h4>Error</h4>
                <p>There was an error checking your permissions. Please try again later.</p>
                <a href="../index.html" class="btn btn-primary mt-3">Back to Homepage</a>
            </div>
        `;
    });
}

// Initialize admin components
function initAdminComponents() {
    // Get references to newly added elements
    const vehicleTableBody = document.getElementById('vehicle-table-body');
    const userTableBody = document.getElementById('user-table-body');
    const addVehicleForm = document.getElementById('add-vehicle-form');
    const editVehicleForm = document.getElementById('edit-vehicle-form');
    const editVehicleModal = document.getElementById('edit-vehicle-modal');
    const closeEditVehicleModal = document.getElementById('close-edit-vehicle-modal');
    
    // Load vehicles and users
    loadVehiclesForAdmin();
    loadUsersForAdmin();
    
    // Add vehicle form submission
    if (addVehicleForm) {
        addVehicleForm.addEventListener('submit', (e) => {
            e.preventDefault();
            addVehicle();
        });
    }
    
    // Edit vehicle form submission
    if (editVehicleForm) {
        editVehicleForm.addEventListener('submit', (e) => {
            e.preventDefault();
            updateVehicle();
        });
    }
    
    // Close edit vehicle modal
    if (closeEditVehicleModal) {
        closeEditVehicleModal.addEventListener('click', () => {
            hideEditVehicleModal();
        });
    }
}

// Load vehicles for admin panel
function loadVehiclesForAdmin() {
    const vehicleTableBody = document.getElementById('vehicle-table-body');
    if (!vehicleTableBody) return;
    
    vehicleTableBody.innerHTML = `
        <tr>
            <td colspan="8" class="text-center">
                <div class="spinner-border spinner-border-sm text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                Loading vehicles...
            </td>
        </tr>
    `;
    
    // Use sample vehicles for demonstration
    setTimeout(() => {
        vehicleTableBody.innerHTML = '';
        
        const sampleVehicles = [
            {
                id: "sample1",
                name: "M1A2 Abrams",
                type: "ground",
                value: 4000,
                demand: "high",
                scarcity: "rare",
                trend: "rising",
                functionality: 8,
                imageUrl: "../assets/abrams.jpg"
            },
            {
                id: "sample2",
                name: "F-22 Raptor",
                type: "air",
                value: 7500,
                demand: "high",
                scarcity: "very-rare",
                trend: "stable",
                functionality: 9,
                imageUrl: "../assets/raptor.jpg"
            },
            {
                id: "sample3",
                name: "USS Nimitz",
                type: "naval",
                value: 10000,
                demand: "medium",
                scarcity: "legendary",
                trend: "stable",
                functionality: 10,
                imageUrl: "../assets/nimitz.jpg"
            },
            {
                id: "sample4",
                name: "Humvee",
                type: "ground",
                value: 1500,
                demand: "medium",
                scarcity: "common",
                trend: "falling",
                functionality: 6,
                imageUrl: "../assets/humvee.jpg"
            },
            {
                id: "sample5",
                name: "UH-60 Black Hawk",
                type: "air",
                value: 5000,
                demand: "high",
                scarcity: "uncommon",
                trend: "rising",
                functionality: 7,
                imageUrl: "../assets/blackhawk.jpg"
            }
        ];

        if (sampleVehicles.length === 0) {
            vehicleTableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">No vehicles found.</td>
                </tr>
            `;
            return;
        }
        
        sampleVehicles.forEach((vehicle) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${vehicle.name}</td>
                <td>${capitalizeFirst(vehicle.type)}</td>
                <td>${vehicle.value}</td>
                <td>${capitalizeFirst(vehicle.demand)}</td>
                <td>${capitalizeFirst(vehicle.scarcity)}</td>
                <td>${capitalizeFirst(vehicle.trend)}</td>
                <td>${vehicle.functionality}/10</td>
                <td>
                    <button class="admin-action edit-vehicle" data-id="${vehicle.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="admin-action delete delete-vehicle" data-id="${vehicle.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            vehicleTableBody.appendChild(row);
            
            // Add event listeners for actions
            row.querySelector('.edit-vehicle').addEventListener('click', () => {
                openEditVehicleModal(vehicle.id);
            });
            
            row.querySelector('.delete-vehicle').addEventListener('click', () => {
                deleteVehicle(vehicle.id);
            });
        });
    }, 500);
}

// Load users for admin panel
function loadUsersForAdmin() {
    const userTableBody = document.getElementById('user-table-body');
    if (!userTableBody) return;
    
    userTableBody.innerHTML = `
        <tr>
            <td colspan="5" class="text-center">
                <div class="spinner-border spinner-border-sm text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                Loading users...
            </td>
        </tr>
    `;
    
    // Use sample users for demonstration
    setTimeout(() => {
        userTableBody.innerHTML = '';
        
        const sampleUsers = [
            {
                id: '1',
                username: 'Aero',
                email: 'aero81710@gmail.com',
                role: 'owner',
                createdAt: '2023-01-01T00:00:00.000Z'
            },
            {
                id: '2',
                username: 'Admin1',
                email: 'admin1@example.com',
                role: 'admin',
                createdAt: '2023-02-15T10:30:00.000Z'
            },
            {
                id: '3',
                username: 'User1',
                email: 'user1@example.com',
                role: 'user',
                createdAt: '2023-03-20T14:45:00.000Z'
            },
            {
                id: '4',
                username: 'User2',
                email: 'user2@example.com',
                role: 'user',
                createdAt: '2023-04-10T09:15:00.000Z'
            }
        ];
        
        if (sampleUsers.length === 0) {
            userTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">No users found.</td>
                </tr>
            `;
            return;
        }
        
        // Mark owner as the current user
        const isOwner = true;
        
        sampleUsers.forEach((user) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${capitalizeFirst(user.role || 'user')}</td>
                <td>${formatTimestamp(user.createdAt)}</td>
                <td class="user-actions">
                    ${user.role !== 'owner' ? `
                        <button class="admin-action make-admin" data-id="${user.id}" ${user.role === 'admin' ? 'style="display:none"' : ''}>
                            Make Admin
                        </button>
                        <button class="admin-action remove-admin" data-id="${user.id}" ${user.role !== 'admin' ? 'style="display:none"' : ''}>
                            Remove Admin
                        </button>
                    ` : 'Owner'}
                </td>
            `;
            userTableBody.appendChild(row);
            
            // If not owner, hide admin management buttons
            if (!isOwner) {
                const adminButtons = row.querySelectorAll('.make-admin, .remove-admin');
                adminButtons.forEach(btn => {
                    btn.style.display = 'none';
                });
            }
            
            // Add event listeners for actions
            const makeAdminBtn = row.querySelector('.make-admin');
            if (makeAdminBtn) {
                makeAdminBtn.addEventListener('click', () => {
                    makeUserAdmin(user.id);
                });
            }
            
            const removeAdminBtn = row.querySelector('.remove-admin');
            if (removeAdminBtn) {
                removeAdminBtn.addEventListener('click', () => {
                    removeUserAdmin(user.id);
                });
            }
        });
    }, 500);
}

// Add new vehicle
function addVehicle() {
    const addVehicleForm = document.getElementById('add-vehicle-form');
    if (!addVehicleForm) return;
    
    const name = document.getElementById('new-vehicle-name').value;
    const type = document.getElementById('new-vehicle-type').value;
    const value = parseInt(document.getElementById('new-vehicle-value').value);
    const demand = document.getElementById('new-vehicle-demand').value;
    const scarcity = document.getElementById('new-vehicle-scarcity').value;
    const trend = document.getElementById('new-vehicle-trend').value;
    const functionality = parseInt(document.getElementById('new-vehicle-functionality').value);
    const imageUrl = document.getElementById('new-vehicle-image').value;
    
    if (!name || !type || isNaN(value) || !demand || !scarcity || !trend || isNaN(functionality)) {
        showAlert("Please fill in all required fields correctly.", "warning");
        return;
    }
    
    // Show loading state
    const submitBtn = addVehicleForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<div class="loading"></div> Adding...';
    submitBtn.disabled = true;
    
    const newVehicle = {
        name,
        type,
        value,
        demand,
        scarcity,
        trend,
        functionality,
        imageUrl: imageUrl || getDefaultImageForType(type)
    };
    
    vehiclesRef.add(newVehicle)
        .then(() => {
            showAlert("Vehicle added successfully!", "success");
            addVehicleForm.reset();
            loadVehiclesForAdmin();
        })
        .catch((error) => {
            console.error("Error adding vehicle:", error);
            showAlert("Error adding vehicle. Please try again.", "danger");
        })
        .finally(() => {
            // Restore button state
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
        });
}

// Open edit vehicle modal
function openEditVehicleModal(vehicleId) {
    const editVehicleModal = document.getElementById('edit-vehicle-modal');
    const editVehicleForm = document.getElementById('edit-vehicle-form');
    if (!editVehicleModal || !editVehicleForm) return;
    
    // Show loading state in modal
    document.getElementById('edit-vehicle-form-content').innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-3">Loading vehicle data...</p>
        </div>
    `;
    
    // Show modal
    editVehicleModal.classList.add('show');
    
    // Get vehicle data
    vehiclesRef.doc(vehicleId).get()
        .then((doc) => {
            if (!doc.exists) {
                showAlert("Vehicle not found.", "danger");
                hideEditVehicleModal();
                return;
            }
            
            const vehicle = doc.data();
            
            // Populate form
            document.getElementById('edit-vehicle-form-content').innerHTML = `
                <input type="hidden" id="edit-vehicle-id" value="${vehicleId}">
                <div class="form-group mb-3">
                    <label for="edit-vehicle-name" class="form-label">Vehicle Name</label>
                    <input type="text" id="edit-vehicle-name" class="form-control" value="${vehicle.name}" required>
                </div>
                <div class="form-group mb-3">
                    <label for="edit-vehicle-type" class="form-label">Type</label>
                    <select id="edit-vehicle-type" class="form-control" required>
                        <option value="air" ${vehicle.type === 'air' ? 'selected' : ''}>Air</option>
                        <option value="ground" ${vehicle.type === 'ground' ? 'selected' : ''}>Ground</option>
                        <option value="naval" ${vehicle.type === 'naval' ? 'selected' : ''}>Naval</option>
                    </select>
                </div>
                <div class="form-group mb-3">
                    <label for="edit-vehicle-value" class="form-label">Value</label>
                    <input type="number" id="edit-vehicle-value" class="form-control" value="${vehicle.value}" min="0" required>
                </div>
                <div class="form-group mb-3">
                    <label for="edit-vehicle-demand" class="form-label">Demand</label>
                    <select id="edit-vehicle-demand" class="form-control" required>
                        <option value="high" ${vehicle.demand === 'high' ? 'selected' : ''}>High</option>
                        <option value="medium" ${vehicle.demand === 'medium' ? 'selected' : ''}>Medium</option>
                        <option value="low" ${vehicle.demand === 'low' ? 'selected' : ''}>Low</option>
                    </select>
                </div>
                <div class="form-group mb-3">
                    <label for="edit-vehicle-scarcity" class="form-label">Scarcity</label>
                    <select id="edit-vehicle-scarcity" class="form-control" required>
                        <option value="common" ${vehicle.scarcity === 'common' ? 'selected' : ''}>Common</option>
                        <option value="uncommon" ${vehicle.scarcity === 'uncommon' ? 'selected' : ''}>Uncommon</option>
                        <option value="rare" ${vehicle.scarcity === 'rare' ? 'selected' : ''}>Rare</option>
                        <option value="very-rare" ${vehicle.scarcity === 'very-rare' ? 'selected' : ''}>Very Rare</option>
                        <option value="legendary" ${vehicle.scarcity === 'legendary' ? 'selected' : ''}>Legendary</option>
                    </select>
                </div>
                <div class="form-group mb-3">
                    <label for="edit-vehicle-trend" class="form-label">Trend</label>
                    <select id="edit-vehicle-trend" class="form-control" required>
                        <option value="rising" ${vehicle.trend === 'rising' ? 'selected' : ''}>Rising</option>
                        <option value="stable" ${vehicle.trend === 'stable' ? 'selected' : ''}>Stable</option>
                        <option value="falling" ${vehicle.trend === 'falling' ? 'selected' : ''}>Falling</option>
                    </select>
                </div>
                <div class="form-group mb-3">
                    <label for="edit-vehicle-functionality" class="form-label">Functionality (1-10)</label>
                    <input type="number" id="edit-vehicle-functionality" class="form-control" value="${vehicle.functionality}" min="1" max="10" required>
                </div>
                <div class="form-group mb-3">
                    <label for="edit-vehicle-image" class="form-label">Image URL</label>
                    <input type="url" id="edit-vehicle-image" class="form-control" value="${vehicle.imageUrl || ''}">
                    <div class="form-text">Leave empty to use default image for the vehicle type</div>
                </div>
                <div class="form-group">
                    <button type="submit" class="btn btn-primary">Update Vehicle</button>
                </div>
            `;
        })
        .catch((error) => {
            console.error("Error getting vehicle data:", error);
            showAlert("Error loading vehicle data. Please try again.", "danger");
            hideEditVehicleModal();
        });
}

// Hide edit vehicle modal
function hideEditVehicleModal() {
    const editVehicleModal = document.getElementById('edit-vehicle-modal');
    if (!editVehicleModal) return;
    
    editVehicleModal.classList.remove('show');
}

// Update vehicle
function updateVehicle() {
    const vehicleId = document.getElementById('edit-vehicle-id').value;
    const name = document.getElementById('edit-vehicle-name').value;
    const type = document.getElementById('edit-vehicle-type').value;
    const value = parseInt(document.getElementById('edit-vehicle-value').value);
    const demand = document.getElementById('edit-vehicle-demand').value;
    const scarcity = document.getElementById('edit-vehicle-scarcity').value;
    const trend = document.getElementById('edit-vehicle-trend').value;
    const functionality = parseInt(document.getElementById('edit-vehicle-functionality').value);
    const imageUrl = document.getElementById('edit-vehicle-image').value;
    
    if (!vehicleId || !name || !type || isNaN(value) || !demand || !scarcity || !trend || isNaN(functionality)) {
        showAlert("Please fill in all required fields correctly.", "warning");
        return;
    }
    
    // Show loading state
    const submitBtn = document.querySelector('#edit-vehicle-form button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<div class="loading"></div> Updating...';
    submitBtn.disabled = true;
    
    const updatedVehicle = {
        name,
        type,
        value,
        demand,
        scarcity,
        trend,
        functionality,
        imageUrl: imageUrl || getDefaultImageForType(type)
    };
    
    vehiclesRef.doc(vehicleId).update(updatedVehicle)
        .then(() => {
            showAlert("Vehicle updated successfully!", "success");
            hideEditVehicleModal();
            loadVehiclesForAdmin();
        })
        .catch((error) => {
            console.error("Error updating vehicle:", error);
            showAlert("Error updating vehicle. Please try again.", "danger");
        })
        .finally(() => {
            // Restore button state
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
        });
}

// Delete vehicle
function deleteVehicle(vehicleId) {
    if (!confirm("Are you sure you want to delete this vehicle? This action cannot be undone.")) {
        return;
    }
    
    vehiclesRef.doc(vehicleId).delete()
        .then(() => {
            showAlert("Vehicle deleted successfully!", "success");
            loadVehiclesForAdmin();
        })
        .catch((error) => {
            console.error("Error deleting vehicle:", error);
            showAlert("Error deleting vehicle. Please try again.", "danger");
        });
}

// Make user admin
function makeUserAdmin(userId) {
    if (!confirm("Are you sure you want to make this user an admin? They will have full access to manage vehicles and view all users.")) {
        return;
    }
    
    usersRef.doc(userId).update({
        role: 'admin'
    })
    .then(() => {
        showAlert("User has been made an admin successfully!", "success");
        loadUsersForAdmin();
    })
    .catch((error) => {
        console.error("Error making user admin:", error);
        showAlert("Error updating user role. Please try again.", "danger");
    });
}

// Remove admin privileges
function removeUserAdmin(userId) {
    if (!confirm("Are you sure you want to remove admin privileges from this user?")) {
        return;
    }
    
    usersRef.doc(userId).update({
        role: 'user'
    })
    .then(() => {
        showAlert("Admin privileges removed successfully!", "success");
        loadUsersForAdmin();
    })
    .catch((error) => {
        console.error("Error removing admin privileges:", error);
        showAlert("Error updating user role. Please try again.", "danger");
    });
}

// Helper Functions
function capitalizeFirst(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function formatTimestamp(timestamp) {
    if (!timestamp) return 'N/A';
    
    try {
        const date = timestamp.toDate();
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        return 'Invalid Date';
    }
}

function getDefaultImageForType(type) {
    if (type === 'air') {
        return 'https://images.unsplash.com/photo-1620059116993-398c21ce8406';
    } else if (type === 'ground') {
        return 'https://images.unsplash.com/photo-1621522626370-ec009a90fbf1';
    } else { // naval
        return 'https://images.unsplash.com/photo-1727007274954-712604e2caf6';
    }
}

// Initialize admin page if on the admin page
if (adminContainer) {
    checkAdminAndLoad();
}
