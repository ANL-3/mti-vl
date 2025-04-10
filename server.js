require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const { randomBytes } = require('crypto');
const { sendVerificationEmail } = require('./email-service');

// Initialize app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '.')));

// Secret for JWT
const JWT_SECRET = process.env.JWT_SECRET || randomBytes(64).toString('hex');

// In-memory storage for verification tokens
const verificationTokens = {};

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Register endpoint
app.post('/api/register', async (req, res) => {
    const { email, username, password } = req.body;
    
    // Validate input
    if (!email || !username || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    
    try {
        const usersData = getUsersFromFile();
        
        // Check if email already exists
        if (usersData.some(user => user.email === email)) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        
        // Create user object
        const newUser = {
            id: Date.now().toString(),
            email,
            username,
            password, // In a real app, this would be hashed
            emailVerified: false,
            role: 'user',
            created: new Date().toISOString()
        };
        
        // Add user to data
        usersData.push(newUser);
        saveUsersToFile(usersData);
        
        // Create verification token
        const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '24h' });
        verificationTokens[newUser.id] = token;
        
        // Send verification email if SendGrid API key is available
        if (process.env.SENDGRID_API_KEY) {
            try {
                await sendVerificationEmail(email, username, token);
                console.log(`Verification email sent to ${email}`);
            } catch (emailError) {
                console.error('Error sending verification email:', emailError);
                // For development, still log the verification link
                const host = req.get('host') || `localhost:${PORT}`;
                const protocol = req.protocol || 'http';
                const verificationLink = `${protocol}://${host}/verify-email?token=${token}`;
                console.log(`Verification link for ${email}: ${verificationLink}`);
            }
        } else {
            // Log verification link in development
            const verificationLink = `http://localhost:${PORT}/verify-email?token=${token}`;
            console.log(`Verification link for ${email}: ${verificationLink}`);
        }
        
        // Return user data (excluding password)
        const { password: _, ...userWithoutPassword } = newUser;
        res.status(201).json(userWithoutPassword);
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// Login endpoint
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    
    try {
        const usersData = getUsersFromFile();
        
        // Find user
        const user = usersData.find(user => user.email === email && user.password === password);
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Return user data (excluding password)
        const { password: _, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// Email verification endpoint
app.post('/api/send-verification', async (req, res) => {
    const { userId, email, username } = req.body;
    
    if (!userId || !email) {
        return res.status(400).json({ error: 'User ID and email are required' });
    }
    
    try {
        // Create verification token
        const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
        verificationTokens[userId] = token;
        
        // Get the host dynamically from request or use a default
        const host = req.get('host') || `localhost:${PORT}`;
        const protocol = req.protocol || 'http';
        const verificationLink = `${protocol}://${host}/verify-email?token=${token}`;
        
        // Check if SendGrid API key is available
        if (process.env.SENDGRID_API_KEY) {
            try {
                // Use our dedicated email service to send verification email
                await sendVerificationEmail(email, username || 'there', token);
                
                console.log(`Verification email sent to ${email}`);
                res.status(200).json({ 
                    message: 'Verification email sent successfully',
                    emailStatus: 'sent',
                    verificationLink // Still include link for testing
                });
            } catch (emailError) {
                console.error('SendGrid error:', emailError);
                // Fallback - just return the link
                res.status(200).json({ 
                    message: 'Failed to send email. Verification link created instead.',
                    emailStatus: 'failed',
                    error: emailError.message,
                    verificationLink
                });
            }
        }
        else {
            // No email service configured, just return the link
            console.log(`Verification link for ${email}: ${verificationLink}`);
            res.status(200).json({ 
                message: 'No email service configured. Verification link created.',
                verificationLink 
            });
        }
    } catch (error) {
        console.error('Send verification error:', error);
        res.status(500).json({ error: 'Server error sending verification' });
    }
});

// Verify email endpoint
app.get('/verify-email', (req, res) => {
    const { token } = req.query;
    
    if (!token) {
        return res.redirect('/pages/verify-email.html?error=invalid-token');
    }
    
    try {
        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        const { userId } = decoded;
        
        // Check if token matches
        if (verificationTokens[userId] !== token) {
            return res.redirect('/pages/verify-email.html?error=invalid-token');
        }
        
        // Update user
        const usersData = getUsersFromFile();
        const userIndex = usersData.findIndex(user => user.id === userId);
        
        if (userIndex === -1) {
            return res.redirect('/pages/verify-email.html?error=user-not-found');
        }
        
        // Mark email as verified
        usersData[userIndex].emailVerified = true;
        saveUsersToFile(usersData);
        
        // Remove verification token
        delete verificationTokens[userId];
        
        // Redirect to success page
        res.redirect('/pages/verify-email.html?verified=true');
    } catch (error) {
        console.error('Verification error:', error);
        res.redirect('/pages/verify-email.html?error=verification-failed');
    }
});

// Helper functions for data management
function getUsersFromFile() {
    try {
        const usersPath = path.join(__dirname, 'data', 'users.json');
        if (!fs.existsSync(usersPath)) {
            // Create directory if it doesn't exist
            if (!fs.existsSync(path.join(__dirname, 'data'))) {
                fs.mkdirSync(path.join(__dirname, 'data'));
            }
            
            // Create file with default owner account
            const defaultUsers = [{
                id: '1',
                username: 'Aero',
                email: 'aero81710@gmail.com',
                password: 'Hh123456@@', // In a real app, this would be hashed
                role: 'owner',
                emailVerified: true,
                created: new Date().toISOString()
            }];
            fs.writeFileSync(usersPath, JSON.stringify(defaultUsers, null, 2));
            return defaultUsers;
        }
        
        const data = fs.readFileSync(usersPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading users file:', error);
        return [];
    }
}

function saveUsersToFile(users) {
    try {
        const usersPath = path.join(__dirname, 'data', 'users.json');
        if (!fs.existsSync(path.dirname(usersPath))) {
            fs.mkdirSync(path.dirname(usersPath));
        }
        fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
    } catch (error) {
        console.error('Error saving users file:', error);
    }
}

// API endpoints to get data
app.get('/api/vehicles', (req, res) => {
    try {
        const vehiclesPath = path.join(__dirname, 'data', 'vehicles.json');
        if (!fs.existsSync(vehiclesPath)) {
            return res.status(404).json({ error: 'Vehicles data not found' });
        }
        
        const vehiclesData = fs.readFileSync(vehiclesPath, 'utf8');
        const vehicles = JSON.parse(vehiclesData);
        
        res.status(200).json(vehicles);
    } catch (error) {
        console.error('Error reading vehicles data:', error);
        res.status(500).json({ error: 'Server error fetching vehicles' });
    }
});

app.get('/api/trading-ads', (req, res) => {
    try {
        const adsPath = path.join(__dirname, 'data', 'tradingAds.json');
        if (!fs.existsSync(adsPath)) {
            return res.status(404).json({ error: 'Trading ads data not found' });
        }
        
        const adsData = fs.readFileSync(adsPath, 'utf8');
        const ads = JSON.parse(adsData);
        
        res.status(200).json(ads);
    } catch (error) {
        console.error('Error reading trading ads data:', error);
        res.status(500).json({ error: 'Server error fetching trading ads' });
    }
});

// Create data directory if it doesn't exist
try {
    if (!fs.existsSync(path.join(__dirname, 'data'))) {
        fs.mkdirSync(path.join(__dirname, 'data'));
    }
} catch (error) {
    console.error('Error creating data directory:', error);
}

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});