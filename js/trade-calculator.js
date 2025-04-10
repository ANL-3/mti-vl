// Trade Calculator Module
// Handles the trade calculator functionality

// DOM Elements
const yourItemsContainer = document.getElementById('your-items');
const theirItemsContainer = document.getElementById('their-items');
const yourItemSelect = document.getElementById('your-item-select');
const theirItemSelect = document.getElementById('their-item-select');
const addYourItemBtn = document.getElementById('add-your-item');
const addTheirItemBtn = document.getElementById('add-their-item');
const confirmYourVehicleBtn = document.getElementById('confirm-your-vehicle');
const confirmTheirVehicleBtn = document.getElementById('confirm-their-vehicle');
const calculateBtn = document.getElementById('calculate-trade');
const tradeResultContainer = document.getElementById('trade-result');
const yourSearchInput = document.getElementById('your-search');
const theirSearchInput = document.getElementById('their-search');
const yourTotalValueDisplay = document.getElementById('your-total-value');
const theirTotalValueDisplay = document.getElementById('their-total-value');
const yourVehicleModal = document.getElementById('your-vehicle-modal');
const theirVehicleModal = document.getElementById('their-vehicle-modal');
const closeModalButtons = document.querySelectorAll('.close-modal');

// Store vehicle data
let vehiclesData = [];
let yourItems = [];
let theirItems = [];

// Load vehicles from Firestore
function loadVehiclesForCalculator() {
    if (!yourItemSelect || !theirItemSelect) return;
    
    try {
        // Use sample data for demo if no vehicles exist
        const populateSampleData = () => {
            if (vehiclesData.length === 0) {
                vehiclesData = getSampleVehicles();
                console.log("Using sample vehicle data for trade calculator");
            }
            
            // Sort vehicles by name
            vehiclesData.sort((a, b) => a.name.localeCompare(b.name));
            
            // Populate select dropdowns
            populateVehicleDropdowns();
        };
        
        // Try to get vehicles from localStorage first
        db.collection('vehicles').get()
            .then((snapshot) => {
                vehiclesData = [];
                snapshot.forEach((doc) => {
                    vehiclesData.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                
                populateSampleData();
            })
            .catch((error) => {
                console.error("Error getting vehicles:", error);
                populateSampleData();
            });
    } catch (error) {
        console.error("Error in loadVehiclesForCalculator:", error);
        showAlert("Error loading vehicles for trade calculator.", "danger");
    }
}

// Populate vehicle dropdowns
function populateVehicleDropdowns() {
    if (!yourItemSelect || !theirItemSelect) return;
    
    // Clear existing options
    yourItemSelect.innerHTML = '<option value="">Select Vehicle</option>';
    theirItemSelect.innerHTML = '<option value="">Select Vehicle</option>';
    
    // Add vehicles to dropdowns
    vehiclesData.forEach(vehicle => {
        const yourOption = document.createElement('option');
        yourOption.value = vehicle.id;
        yourOption.textContent = `${vehicle.name} (${vehicle.value})`;
        yourOption.dataset.type = vehicle.type;
        
        const theirOption = document.createElement('option');
        theirOption.value = vehicle.id;
        theirOption.textContent = `${vehicle.name} (${vehicle.value})`;
        theirOption.dataset.type = vehicle.type;
        
        yourItemSelect.appendChild(yourOption);
        theirItemSelect.appendChild(theirOption);
    });
}

// Filter dropdown options based on search input
function filterVehicleDropdown(searchInput, selectElement) {
    const searchTerm = searchInput.value.toLowerCase();
    const options = selectElement.querySelectorAll('option');
    
    options.forEach(option => {
        if (option.value === "") return; // Skip the default option
        
        const text = option.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            option.style.display = '';
        } else {
            option.style.display = 'none';
        }
    });
}

// Add vehicle to your side
function addYourItem() {
    if (!yourItemSelect || !yourItemsContainer) return;
    
    const selectedId = yourItemSelect.value;
    if (!selectedId) return;
    
    const vehicle = vehiclesData.find(v => v.id === selectedId);
    if (!vehicle) return;
    
    // Add to your items array
    yourItems.push(vehicle);
    
    // Update UI
    renderTradeItems();
}

// Add vehicle to their side
function addTheirItem() {
    if (!theirItemSelect || !theirItemsContainer) return;
    
    const selectedId = theirItemSelect.value;
    if (!selectedId) return;
    
    const vehicle = vehiclesData.find(v => v.id === selectedId);
    if (!vehicle) return;
    
    // Add to their items array
    theirItems.push(vehicle);
    
    // Update UI
    renderTradeItems();
}

// Remove item from your side
function removeYourItem(index) {
    yourItems.splice(index, 1);
    renderTradeItems();
}

// Remove item from their side
function removeTheirItem(index) {
    theirItems.splice(index, 1);
    renderTradeItems();
}



// Calculate trade
function calculateTrade() {
    if (!tradeResultContainer) return;
    
    // Check if both sides have items
    if (yourItems.length === 0 || theirItems.length === 0) {
        tradeResultContainer.innerHTML = `
            <div class="alert alert-warning">
                Please add vehicles to both sides of the trade before calculating.
            </div>
        `;
        return;
    }
    
    // Calculate total values
    const yourValue = yourItems.reduce((total, item) => total + item.value, 0);
    const theirValue = theirItems.reduce((total, item) => total + item.value, 0);
    
    // Calculate difference
    const difference = yourValue - theirValue;
    const absDifference = Math.abs(difference);
    
    // Determine if win, fair, or loss
    let result, resultClass, resultIcon;
    
    if (absDifference <= 500) {
        result = "FAIR TRADE";
        resultClass = "result-fair";
        resultIcon = '<i class="fas fa-equals"></i>';
    } else if (difference > 0) {
        result = "LOSS";
        resultClass = "result-loss";
        resultIcon = '<i class="fas fa-arrow-down"></i>';
    } else {
        result = "WIN";
        resultClass = "result-win";
        resultIcon = '<i class="fas fa-arrow-up"></i>';
    }
    
    // Update result container
    tradeResultContainer.innerHTML = `
        <div class="trade-result ${resultClass}">
            <div class="result-header">
                <div class="result-icon">${resultIcon}</div>
                <div class="result-verdict">${result}</div>
            </div>
            <div class="result-details">
                <div>YOUR TOTAL: <strong>${yourValue}</strong></div>
                <div>THEIR TOTAL: <strong>${theirValue}</strong></div>
                <div>DIFFERENCE: <strong>${absDifference}</strong></div>
            </div>
        </div>
    `;
}

// Show and hide modal functions
function showModal(modal) {
    if (modal) {
        modal.classList.add('show');
    }
}

function hideModal(modal) {
    if (modal) {
        modal.classList.remove('show');
    }
}

// Update total values
function updateTotalValues() {
    const yourValue = yourItems.reduce((total, item) => total + item.value, 0);
    const theirValue = theirItems.reduce((total, item) => total + item.value, 0);
    
    if (yourTotalValueDisplay) {
        yourTotalValueDisplay.textContent = yourValue;
    }
    
    if (theirTotalValueDisplay) {
        theirTotalValueDisplay.textContent = theirValue;
    }
}

// Render trade items (modified to include empty state message)
function renderTradeItems() {
    if (!yourItemsContainer || !theirItemsContainer) return;
    
    // Render your items
    if (yourItems.length === 0) {
        yourItemsContainer.innerHTML = '<div class="text-center text-muted empty-message">Add vehicles to your side</div>';
    } else {
        yourItemsContainer.innerHTML = '';
        yourItems.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'trade-item';
            itemElement.innerHTML = `
                <span class="trade-item-name">${item.name}</span>
                <span class="trade-item-value">${item.value}</span>
                <button class="trade-item-remove" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            yourItemsContainer.appendChild(itemElement);
        });
        
        // Add event listeners for your remove buttons
        const yourRemoveButtons = yourItemsContainer.querySelectorAll('.trade-item-remove');
        yourRemoveButtons.forEach(button => {
            button.addEventListener('click', () => {
                const index = parseInt(button.dataset.index);
                removeYourItem(index);
            });
        });
    }
    
    // Render their items
    if (theirItems.length === 0) {
        theirItemsContainer.innerHTML = '<div class="text-center text-muted empty-message">Add vehicles to their side</div>';
    } else {
        theirItemsContainer.innerHTML = '';
        theirItems.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'trade-item';
            itemElement.innerHTML = `
                <span class="trade-item-name">${item.name}</span>
                <span class="trade-item-value">${item.value}</span>
                <button class="trade-item-remove" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            theirItemsContainer.appendChild(itemElement);
        });
        
        // Add event listeners for their remove buttons
        const theirRemoveButtons = theirItemsContainer.querySelectorAll('.trade-item-remove');
        theirRemoveButtons.forEach(button => {
            button.addEventListener('click', () => {
                const index = parseInt(button.dataset.index);
                removeTheirItem(index);
            });
        });
    }
    
    // Update total values
    updateTotalValues();
}

// Event listeners
// Modal open buttons
if (addYourItemBtn) {
    addYourItemBtn.addEventListener('click', () => {
        showModal(yourVehicleModal);
    });
}

if (addTheirItemBtn) {
    addTheirItemBtn.addEventListener('click', () => {
        showModal(theirVehicleModal);
    });
}

// Modal close buttons
if (closeModalButtons) {
    closeModalButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modalId = button.dataset.close;
            const modal = document.getElementById(modalId);
            if (modal) {
                hideModal(modal);
            }
        });
    });
}

// Confirm vehicle buttons
if (confirmYourVehicleBtn) {
    confirmYourVehicleBtn.addEventListener('click', () => {
        addYourItem();
        hideModal(yourVehicleModal);
        
        // Reset select and search
        if (yourItemSelect) yourItemSelect.value = '';
        if (yourSearchInput) yourSearchInput.value = '';
    });
}

if (confirmTheirVehicleBtn) {
    confirmTheirVehicleBtn.addEventListener('click', () => {
        addTheirItem();
        hideModal(theirVehicleModal);
        
        // Reset select and search
        if (theirItemSelect) theirItemSelect.value = '';
        if (theirSearchInput) theirSearchInput.value = '';
    });
}

// Calculate button
if (calculateBtn) {
    calculateBtn.addEventListener('click', calculateTrade);
}

// Search filters
if (yourSearchInput) {
    yourSearchInput.addEventListener('input', () => {
        filterVehicleDropdown(yourSearchInput, yourItemSelect);
    });
}

if (theirSearchInput) {
    theirSearchInput.addEventListener('input', () => {
        filterVehicleDropdown(theirSearchInput, theirItemSelect);
    });
}

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    if (event.target === yourVehicleModal) {
        hideModal(yourVehicleModal);
    } else if (event.target === theirVehicleModal) {
        hideModal(theirVehicleModal);
    }
});

// Sample vehicle data for demonstration
function getSampleVehicles() {
    return [
        {
            id: "sample1",
            name: "M1A2 Abrams",
            type: "ground",
            value: 4000,
            demand: "high",
            scarcity: "rare",
            trend: "rising",
            functionality: "combat",
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
            functionality: "combat",
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
            functionality: "transport",
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
            functionality: "transport",
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
            functionality: "transport",
            imageUrl: "../assets/blackhawk.jpg"
        }
    ];
}

// Initialize trade calculator if on the trade calculator page
if (yourItemSelect && theirItemSelect) {
    loadVehiclesForCalculator();
}
