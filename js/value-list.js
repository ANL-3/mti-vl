// Value List Module
// Handles the display and filtering of vehicle value list

// Vehicle collection reference
const vehiclesRef = db.collection('vehicles');

// DOM Elements
const vehicleListContainer = document.getElementById('vehicle-list');
const searchInput = document.getElementById('search-input');
const allFilterBtn = document.getElementById('filter-all');
const airFilterBtn = document.getElementById('filter-air');
const groundFilterBtn = document.getElementById('filter-ground');
const navalFilterBtn = document.getElementById('filter-naval');

// Vehicle data cache
let allVehicles = [];
let currentFilter = 'all';

// Load vehicles from API or use sample data
function loadVehicles() {
    showLoadingIndicator();
    
    try {
        // Function to load sample vehicles directly (fallback)
        const loadSampleData = () => {
            console.log("Using sample vehicle data directly");
            allVehicles = [];
            
            // Get sample vehicles directly from the sample data
            const sampleVehicles = getSampleVehicles();
            sampleVehicles.forEach((vehicle, index) => {
                allVehicles.push({
                    id: 'sample-' + index,
                    ...vehicle
                });
            });
            
            // Display vehicles
            filterVehicles(currentFilter);
            hideLoadingIndicator();
        };
        
        // Determine if we should use the backend API or local sample data
        const useApi = window.location.origin.includes('localhost') || window.location.origin.includes('replit');
        
        if (useApi) {
            // Use the API to fetch vehicles
            fetch('/api/vehicles')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to fetch vehicles');
                    }
                    return response.json();
                })
                .then(vehicles => {
                    allVehicles = vehicles;
                    
                    if (allVehicles.length === 0) {
                        // If no vehicles returned, use sample data directly
                        loadSampleData();
                    } else {
                        // Display vehicles from API
                        filterVehicles(currentFilter);
                        hideLoadingIndicator();
                    }
                })
                .catch(error => {
                    console.error("Error fetching vehicles:", error);
                    // On error, load sample data
                    loadSampleData();
                });
        } else {
            // Try to get vehicles from database (legacy method)
            vehiclesRef.get()
                .then((snapshot) => {
                    allVehicles = [];
                    snapshot.forEach((doc) => {
                        allVehicles.push({
                            id: doc.id,
                            ...doc.data()
                        });
                    });
                    
                    if (allVehicles.length === 0) {
                        // If no vehicles in database, use sample data directly
                        loadSampleData();
                    } else {
                        // Display vehicles from database
                        filterVehicles(currentFilter);
                        hideLoadingIndicator();
                    }
                })
                .catch((error) => {
                    console.error("Error getting vehicles:", error);
                    // On error, load sample data
                    loadSampleData();
                });
        }
    } catch (error) {
        console.error("Error in loadVehicles:", error);
        hideLoadingIndicator();
        
        if (vehicleListContainer) {
            vehicleListContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle"></i> Error loading vehicles. Please try again later.
                </div>
            `;
        }
    }
}

// Filter vehicles by type
function filterVehicles(filter) {
    currentFilter = filter;
    
    // Clear active class from all filter buttons
    allFilterBtn.classList.remove('active');
    airFilterBtn.classList.remove('active');
    groundFilterBtn.classList.remove('active');
    navalFilterBtn.classList.remove('active');
    
    // Add active class to selected filter button
    if (filter === 'all') {
        allFilterBtn.classList.add('active');
    } else if (filter === 'air') {
        airFilterBtn.classList.add('active');
    } else if (filter === 'ground') {
        groundFilterBtn.classList.add('active');
    } else if (filter === 'naval') {
        navalFilterBtn.classList.add('active');
    }
    
    // Filter vehicles by type and search term
    const searchTerm = searchInput.value.toLowerCase();
    let filteredVehicles = allVehicles;
    
    if (filter !== 'all') {
        filteredVehicles = allVehicles.filter(vehicle => vehicle.type === filter);
    }
    
    if (searchTerm) {
        filteredVehicles = filteredVehicles.filter(vehicle => 
            vehicle.name.toLowerCase().includes(searchTerm)
        );
    }
    
    // Sort vehicles by value (descending)
    filteredVehicles.sort((a, b) => b.value - a.value);
    
    // Display vehicles
    displayVehicles(filteredVehicles);
}

// Display vehicles
function displayVehicles(vehicles) {
    if (!vehicleListContainer) return;
    
    vehicleListContainer.innerHTML = '';
    
    if (vehicles.length === 0) {
        vehicleListContainer.innerHTML = `
            <div class="col-12 text-center">
                <p>No vehicles found. Try a different search or filter.</p>
            </div>
        `;
        return;
    }
    
    vehicles.forEach(vehicle => {
        const vehicleCard = document.createElement('div');
        vehicleCard.className = 'col-md-4 col-lg-3 mb-4';
        vehicleCard.innerHTML = `
            <div class="vehicle-card ${vehicle.type}">
                <div class="vehicle-image">
                    <img src="${vehicle.imageUrl || getDefaultImageForType(vehicle.type)}" alt="${vehicle.name}" class="img-fluid">
                    <div class="vehicle-category">${capitalizeFirst(vehicle.type)}</div>
                </div>
                <div class="vehicle-details">
                    <h3>${vehicle.name}</h3>
                    <div class="vehicle-stats">
                        <div class="stat"><span>Value:</span> ${vehicle.value}</div>
                        <div class="stat"><span>Demand:</span> <i class="fas fa-arrow-${getDemandIcon(vehicle.demand)} ${getDemandClass(vehicle.demand)}"></i></div>
                        <div class="stat"><span>Scarcity:</span> <i class="fas fa-circle ${getRarityClass(vehicle.scarcity)}"></i></div>
                        <div class="stat"><span>Trend:</span> <i class="fas fa-chart-line ${getTrendClass(vehicle.trend)}"></i></div>
                        <div class="stat"><span>Functionality:</span> <span class="${getFunctionalityClass(vehicle.functionality)}">${vehicle.functionality}/10</span></div>
                    </div>
                </div>
            </div>
        `;
        vehicleListContainer.appendChild(vehicleCard);
    });
}

// Event Listeners
if (searchInput) {
    searchInput.addEventListener('input', () => {
        filterVehicles(currentFilter);
    });
}

if (allFilterBtn) {
    allFilterBtn.addEventListener('click', () => filterVehicles('all'));
}

if (airFilterBtn) {
    airFilterBtn.addEventListener('click', () => filterVehicles('air'));
}

if (groundFilterBtn) {
    groundFilterBtn.addEventListener('click', () => filterVehicles('ground'));
}

if (navalFilterBtn) {
    navalFilterBtn.addEventListener('click', () => filterVehicles('naval'));
}

// Helper Functions
function getDefaultImageForType(type) {
    if (type === 'air') {
        return 'https://images.unsplash.com/photo-1620059116993-398c21ce8406';
    } else if (type === 'ground') {
        return 'https://images.unsplash.com/photo-1621522626370-ec009a90fbf1';
    } else { // naval
        return 'https://images.unsplash.com/photo-1727007274954-712604e2caf6';
    }
}

function getDemandIcon(demand) {
    if (demand === 'high') return 'up';
    if (demand === 'medium') return 'right';
    return 'down';
}

function getDemandClass(demand) {
    if (demand === 'high') return 'high';
    if (demand === 'medium') return 'medium';
    return 'low';
}

function getRarityClass(rarity) {
    if (rarity === 'common') return 'common';
    if (rarity === 'uncommon') return 'uncommon';
    if (rarity === 'rare') return 'rare';
    if (rarity === 'very-rare') return 'very-rare';
    return 'legendary';
}

function getTrendClass(trend) {
    if (trend === 'rising') return 'high';
    if (trend === 'stable') return 'medium';
    return 'low';
}

function getFunctionalityClass(functionality) {
    if (functionality >= 8) return 'high';
    if (functionality >= 5) return 'medium';
    return 'low';
}

function capitalizeFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function showLoadingIndicator() {
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'loading-indicator';
    loadingIndicator.className = 'text-center my-5';
    loadingIndicator.innerHTML = `
        <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2">Loading vehicles...</p>
    `;
    
    if (vehicleListContainer) {
        vehicleListContainer.innerHTML = '';
        vehicleListContainer.appendChild(loadingIndicator);
    }
}

function hideLoadingIndicator() {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
}

// Populate sample vehicles (first run only)
async function populateSampleVehicles() {
    const sampleVehicles = [
        // Air vehicles
        {
            name: "F-22 Raptor",
            type: "air",
            value: 9500,
            demand: "high",
            scarcity: "rare",
            trend: "rising",
            functionality: 9,
            imageUrl: "https://images.unsplash.com/photo-1620059116993-398c21ce8406"
        },
        {
            name: "Apache Helicopter",
            type: "air",
            value: 7800,
            demand: "high",
            scarcity: "uncommon",
            trend: "stable",
            functionality: 8,
            imageUrl: "https://images.unsplash.com/photo-1718313900144-ae5f5a640f4b"
        },
        {
            name: "AC-130 Gunship",
            type: "air",
            value: 10200,
            demand: "medium",
            scarcity: "very-rare",
            trend: "rising",
            functionality: 7,
            imageUrl: "https://images.unsplash.com/photo-1594652634010-275456c808d0"
        },
        {
            name: "Su-35 Flanker",
            type: "air",
            value: 8600,
            demand: "medium",
            scarcity: "rare",
            trend: "stable",
            functionality: 8,
            imageUrl: "https://images.unsplash.com/photo-1620059116993-398c21ce8406"
        },
        // Ground vehicles
        {
            name: "M1A2 Abrams",
            type: "ground",
            value: 7200,
            demand: "medium",
            scarcity: "uncommon",
            trend: "stable",
            functionality: 10,
            imageUrl: "https://images.unsplash.com/photo-1621522626370-ec009a90fbf1"
        },
        {
            name: "Challenger 2",
            type: "ground",
            value: 6800,
            demand: "medium",
            scarcity: "uncommon",
            trend: "falling",
            functionality: 9,
            imageUrl: "https://images.unsplash.com/photo-1540898824226-21f19654dcf1"
        },
        {
            name: "MRAP Vehicle",
            type: "ground",
            value: 4300,
            demand: "low",
            scarcity: "common",
            trend: "stable",
            functionality: 7,
            imageUrl: "https://images.unsplash.com/photo-1522069213448-443a614da9b6"
        },
        {
            name: "T-90 Tank",
            type: "ground",
            value: 6500,
            demand: "medium",
            scarcity: "uncommon",
            trend: "stable",
            functionality: 8,
            imageUrl: "https://images.unsplash.com/photo-1621522626370-ec009a90fbf1"
        },
        // Naval vehicles
        {
            name: "Nimitz Carrier",
            type: "naval",
            value: 12000,
            demand: "high",
            scarcity: "very-rare",
            trend: "rising",
            functionality: 10,
            imageUrl: "https://images.unsplash.com/photo-1727007274954-712604e2caf6"
        },
        {
            name: "Arleigh Burke Destroyer",
            type: "naval",
            value: 8500,
            demand: "medium",
            scarcity: "rare",
            trend: "stable",
            functionality: 9,
            imageUrl: "https://images.unsplash.com/photo-1727007275126-02eb3b4866c3"
        },
        {
            name: "Virginia Class Submarine",
            type: "naval",
            value: 9800,
            demand: "high",
            scarcity: "very-rare",
            trend: "rising",
            functionality: 7,
            imageUrl: "https://images.unsplash.com/photo-1511213966740-24d719a0a814"
        },
        {
            name: "Patrol Boat",
            type: "naval",
            value: 3200,
            demand: "low",
            scarcity: "common",
            trend: "falling",
            functionality: 6,
            imageUrl: "https://images.unsplash.com/photo-1511213966740-24d719a0a814"
        }
    ];
    
    // Create a batch to add all vehicles
    const batch = db.batch();
    
    sampleVehicles.forEach(vehicle => {
        const newVehicleRef = vehiclesRef.doc();
        batch.set(newVehicleRef, vehicle);
    });
    
    return batch.commit();
}

// Get sample vehicles (reuse existing sample data)
function getSampleVehicles() {
    return [
        // Air vehicles
        {
            name: "F-22 Raptor",
            type: "air",
            value: 9500,
            demand: "high",
            scarcity: "rare",
            trend: "rising",
            functionality: 9,
            imageUrl: "https://images.unsplash.com/photo-1620059116993-398c21ce8406"
        },
        {
            name: "Apache Helicopter",
            type: "air",
            value: 7800,
            demand: "high",
            scarcity: "uncommon",
            trend: "stable",
            functionality: 8,
            imageUrl: "https://images.unsplash.com/photo-1718313900144-ae5f5a640f4b"
        },
        {
            name: "AC-130 Gunship",
            type: "air",
            value: 10200,
            demand: "medium",
            scarcity: "very-rare",
            trend: "rising",
            functionality: 7,
            imageUrl: "https://images.unsplash.com/photo-1594652634010-275456c808d0"
        },
        {
            name: "Su-35 Flanker",
            type: "air",
            value: 8600,
            demand: "medium",
            scarcity: "rare",
            trend: "stable",
            functionality: 8,
            imageUrl: "https://images.unsplash.com/photo-1620059116993-398c21ce8406"
        },
        // Ground vehicles
        {
            name: "M1A2 Abrams",
            type: "ground",
            value: 7200,
            demand: "medium",
            scarcity: "uncommon",
            trend: "stable",
            functionality: 10,
            imageUrl: "https://images.unsplash.com/photo-1621522626370-ec009a90fbf1"
        },
        {
            name: "Challenger 2",
            type: "ground",
            value: 6800,
            demand: "medium",
            scarcity: "uncommon",
            trend: "falling",
            functionality: 9,
            imageUrl: "https://images.unsplash.com/photo-1540898824226-21f19654dcf1"
        },
        {
            name: "MRAP Vehicle",
            type: "ground",
            value: 4300,
            demand: "low",
            scarcity: "common",
            trend: "stable",
            functionality: 7,
            imageUrl: "https://images.unsplash.com/photo-1522069213448-443a614da9b6"
        },
        {
            name: "T-90 Tank",
            type: "ground",
            value: 6500,
            demand: "medium",
            scarcity: "uncommon",
            trend: "stable",
            functionality: 8,
            imageUrl: "https://images.unsplash.com/photo-1621522626370-ec009a90fbf1"
        },
        // Naval vehicles
        {
            name: "Nimitz Carrier",
            type: "naval",
            value: 12000,
            demand: "high",
            scarcity: "very-rare",
            trend: "rising",
            functionality: 10,
            imageUrl: "https://images.unsplash.com/photo-1727007274954-712604e2caf6"
        },
        {
            name: "Arleigh Burke Destroyer",
            type: "naval",
            value: 8500,
            demand: "medium",
            scarcity: "rare",
            trend: "stable",
            functionality: 9,
            imageUrl: "https://images.unsplash.com/photo-1727007275126-02eb3b4866c3"
        },
        {
            name: "Virginia Class Submarine",
            type: "naval",
            value: 9800,
            demand: "high",
            scarcity: "very-rare",
            trend: "rising",
            functionality: 7,
            imageUrl: "https://images.unsplash.com/photo-1511213966740-24d719a0a814"
        },
        {
            name: "Patrol Boat",
            type: "naval",
            value: 3200,
            demand: "low",
            scarcity: "common",
            trend: "falling",
            functionality: 6,
            imageUrl: "https://images.unsplash.com/photo-1511213966740-24d719a0a814"
        }
    ];
}

// Initialize vehicle list if on the value list page
if (vehicleListContainer) {
    loadVehicles();
}
