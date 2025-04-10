// LocalDB Auth System
// This script sets up a local storage-based authentication and database system

// Initialize LocalDB system
const LocalDB = {
    // Storage keys
    USERS_KEY: 'mt_users',
    VEHICLES_KEY: 'mt_vehicles',
    ADS_KEY: 'mt_ads',
    CURRENT_USER_KEY: 'mt_current_user',
    
    // Initialize the database with default values if not present
    init() {
        // Initialize users collection if not exists
        if (!localStorage.getItem(this.USERS_KEY)) {
            // Create owner account by default
            const defaultUsers = [{
                id: '1',
                username: 'Aero',
                email: 'aero81710@gmail.com',
                password: this.hashPassword('Hh123456@@'),
                role: 'owner',
                emailVerified: true,
                created: new Date().toISOString(),
                settings: {
                    darkMode: true,
                    tradeNotifications: true,
                    soundEffects: true,
                    theme: 'default'
                }
            }];
            localStorage.setItem(this.USERS_KEY, JSON.stringify(defaultUsers));
        }
        
        // Initialize vehicles collection if not exists
        if (!localStorage.getItem(this.VEHICLES_KEY)) {
            localStorage.setItem(this.VEHICLES_KEY, JSON.stringify([]));
        }
        
        // Initialize ads collection if not exists
        if (!localStorage.getItem(this.ADS_KEY)) {
            localStorage.setItem(this.ADS_KEY, JSON.stringify([]));
        }
    },
    
    // Simple password hashing (for demo purposes - not secure for production)
    hashPassword(password) {
        // In a real app, you would use bcrypt or a similar secure hashing algorithm
        // This is just a simple hash for demonstration
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString(16);
    },
    
    // Auth methods that mimic Firebase auth
    auth: {
        currentUser: null,
        
        // Set current user from localStorage on page load
        init() {
            const userData = localStorage.getItem(LocalDB.CURRENT_USER_KEY);
            if (userData) {
                try {
                    this.currentUser = JSON.parse(userData);
                    console.log('User is logged in:', this.currentUser.username);
                } catch (error) {
                    console.error('Error parsing current user data:', error);
                    this.currentUser = null;
                }
            } else {
                console.log('User is logged out');
            }
        },
        
        // Auth state changed listeners
        _listeners: [],
        onAuthStateChanged(callback) {
            this._listeners.push(callback);
            // Immediately call with current state
            callback(this.currentUser);
            return () => {
                // Return unsubscribe function
                this._listeners = this._listeners.filter(cb => cb !== callback);
            };
        },
        
        // Trigger all auth state listeners
        _triggerAuthChanged() {
            this._listeners.forEach(callback => callback(this.currentUser));
        },
        
        // Sign up with email and password
        createUserWithEmailAndPassword(email, password) {
            return new Promise((resolve, reject) => {
                try {
                    // Get users collection
                    const users = JSON.parse(localStorage.getItem(LocalDB.USERS_KEY) || '[]');
                    
                    // Check if email already exists
                    if (users.find(user => user.email === email)) {
                        reject({ code: 'auth/email-already-in-use', message: 'Email already in use' });
                        return;
                    }
                    
                    // Create new user
                    const newUser = {
                        id: Date.now().toString(),
                        email,
                        password: LocalDB.hashPassword(password),
                        username: email.split('@')[0],
                        role: 'user',
                        emailVerified: false,
                        created: new Date().toISOString(),
                        settings: {
                            darkMode: true,
                            tradeNotifications: true,
                            soundEffects: true,
                            theme: 'default'
                        }
                    };
                    
                    // Add to users collection
                    users.push(newUser);
                    localStorage.setItem(LocalDB.USERS_KEY, JSON.stringify(users));
                    
                    // Set as current user (excluding password)
                    const { password: _, ...userWithoutPassword } = newUser;
                    this.currentUser = userWithoutPassword;
                    localStorage.setItem(LocalDB.CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));
                    
                    // Trigger auth changed event
                    this._triggerAuthChanged();
                    
                    resolve({ user: userWithoutPassword });
                } catch (error) {
                    reject({ code: 'auth/operation-failed', message: error.message });
                }
            });
        },
        
        // Sign in with email and password
        signInWithEmailAndPassword(email, password) {
            return new Promise((resolve, reject) => {
                try {
                    // Get users collection
                    const users = JSON.parse(localStorage.getItem(LocalDB.USERS_KEY) || '[]');
                    
                    // Find user with matching email
                    const user = users.find(user => user.email === email);
                    
                    // Check if user exists and password matches
                    if (!user || user.password !== LocalDB.hashPassword(password)) {
                        reject({ code: 'auth/wrong-password', message: 'Incorrect email or password' });
                        return;
                    }
                    
                    // Set as current user (excluding password)
                    const { password: _, ...userWithoutPassword } = user;
                    this.currentUser = userWithoutPassword;
                    localStorage.setItem(LocalDB.CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));
                    
                    // Trigger auth changed event
                    this._triggerAuthChanged();
                    
                    resolve({ user: userWithoutPassword });
                } catch (error) {
                    reject({ code: 'auth/operation-failed', message: error.message });
                }
            });
        },
        
        // Sign out
        signOut() {
            return new Promise((resolve, reject) => {
                try {
                    // Clear current user
                    this.currentUser = null;
                    localStorage.removeItem(LocalDB.CURRENT_USER_KEY);
                    
                    // Trigger auth changed event
                    this._triggerAuthChanged();
                    
                    resolve();
                } catch (error) {
                    reject({ code: 'auth/operation-failed', message: error.message });
                }
            });
        }
    },
    
    // Database methods that mimic Firestore
    db: {
        // Get a collection
        collection(collectionName) {
            const storageKey = collectionName === 'users' 
                ? LocalDB.USERS_KEY 
                : collectionName === 'vehicles' 
                    ? LocalDB.VEHICLES_KEY 
                    : collectionName === 'ads' 
                        ? LocalDB.ADS_KEY 
                        : null;
                        
            if (!storageKey) {
                throw new Error(`Collection ${collectionName} not supported`);
            }
            
            return {
                // Get a document by ID
                doc(id) {
                    return {
                        // Get document data
                        get() {
                            return new Promise((resolve, reject) => {
                                try {
                                    const collection = JSON.parse(localStorage.getItem(storageKey) || '[]');
                                    const doc = collection.find(item => item.id === id);
                                    
                                    if (doc) {
                                        resolve({
                                            exists: true,
                                            data: () => ({ ...doc }),
                                            id: doc.id
                                        });
                                    } else {
                                        resolve({ exists: false, data: () => null, id });
                                    }
                                } catch (error) {
                                    reject(error);
                                }
                            });
                        },
                        
                        // Update document
                        update(data) {
                            return new Promise((resolve, reject) => {
                                try {
                                    const collection = JSON.parse(localStorage.getItem(storageKey) || '[]');
                                    const index = collection.findIndex(item => item.id === id);
                                    
                                    if (index !== -1) {
                                        // Merge with existing data
                                        collection[index] = { ...collection[index], ...data };
                                        localStorage.setItem(storageKey, JSON.stringify(collection));
                                        resolve();
                                    } else {
                                        reject(new Error('Document not found'));
                                    }
                                } catch (error) {
                                    reject(error);
                                }
                            });
                        },
                        
                        // Set document (overwrite)
                        set(data) {
                            return new Promise((resolve, reject) => {
                                try {
                                    const collection = JSON.parse(localStorage.getItem(storageKey) || '[]');
                                    const index = collection.findIndex(item => item.id === id);
                                    
                                    if (index !== -1) {
                                        // Replace entire document
                                        collection[index] = { id, ...data };
                                    } else {
                                        // Add new document with specified ID
                                        collection.push({ id, ...data });
                                    }
                                    
                                    localStorage.setItem(storageKey, JSON.stringify(collection));
                                    resolve();
                                } catch (error) {
                                    reject(error);
                                }
                            });
                        },
                        
                        // Delete document
                        delete() {
                            return new Promise((resolve, reject) => {
                                try {
                                    const collection = JSON.parse(localStorage.getItem(storageKey) || '[]');
                                    const newCollection = collection.filter(item => item.id !== id);
                                    
                                    localStorage.setItem(storageKey, JSON.stringify(newCollection));
                                    resolve();
                                } catch (error) {
                                    reject(error);
                                }
                            });
                        }
                    };
                },
                
                // Add a new document with auto-generated ID
                add(data) {
                    return new Promise((resolve, reject) => {
                        try {
                            const collection = JSON.parse(localStorage.getItem(storageKey) || '[]');
                            const newItem = { id: Date.now().toString(), ...data };
                            
                            collection.push(newItem);
                            localStorage.setItem(storageKey, JSON.stringify(collection));
                            
                            resolve({ id: newItem.id });
                        } catch (error) {
                            reject(error);
                        }
                    });
                },
                
                // Get all documents in collection
                get() {
                    return new Promise((resolve, reject) => {
                        try {
                            const collection = JSON.parse(localStorage.getItem(storageKey) || '[]');
                            
                            resolve({
                                docs: collection.map(item => ({
                                    id: item.id,
                                    data: () => ({ ...item }),
                                    exists: true
                                })),
                                empty: collection.length === 0,
                                size: collection.length
                            });
                        } catch (error) {
                            reject(error);
                        }
                    });
                },
                
                // Add where clause
                where(field, operator, value) {
                    return {
                        get: () => {
                            return new Promise((resolve, reject) => {
                                try {
                                    const collection = JSON.parse(localStorage.getItem(storageKey) || '[]');
                                    
                                    let filteredCollection = collection;
                                    if (operator === '==') {
                                        filteredCollection = collection.filter(item => item[field] === value);
                                    } else if (operator === '!=') {
                                        filteredCollection = collection.filter(item => item[field] !== value);
                                    } else if (operator === '>') {
                                        filteredCollection = collection.filter(item => item[field] > value);
                                    } else if (operator === '>=') {
                                        filteredCollection = collection.filter(item => item[field] >= value);
                                    } else if (operator === '<') {
                                        filteredCollection = collection.filter(item => item[field] < value);
                                    } else if (operator === '<=') {
                                        filteredCollection = collection.filter(item => item[field] <= value);
                                    }
                                    
                                    resolve({
                                        docs: filteredCollection.map(item => ({
                                            id: item.id,
                                            data: () => ({ ...item }),
                                            exists: true
                                        })),
                                        empty: filteredCollection.length === 0,
                                        size: filteredCollection.length
                                    });
                                } catch (error) {
                                    reject(error);
                                }
                            });
                        }
                    };
                }
            };
        }
    }
};

// Initialize LocalDB
LocalDB.init();

// Initialize Auth
LocalDB.auth.init();

// Provide Firebase-compatible variables for the rest of the app
const db = LocalDB.db;
const auth = LocalDB.auth;

console.log("Local authentication system initialized successfully!");

/*
Firebase setup complete!

Important notes:
1. Make sure the Authentication section in Firebase has Email/Password and Google sign-in methods enabled
2. Ensure Firestore Database is created and rules are set appropriately
3. Add your domain (or localhost) to the "Authorized Domains" list in the Authentication section
*/
