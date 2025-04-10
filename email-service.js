// Email Service using SendGrid
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

// Set SendGrid API Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Send a verification email to the user
 * @param {string} to - Recipient email address
 * @param {string} name - Recipient name
 * @param {string} verificationToken - Token for email verification
 * @returns {Promise} - SendGrid API response
 */
async function sendVerificationEmail(to, name, verificationToken) {
    // Create the base URL based on the environment
    const appUrl = process.env.APP_URL || 'http://localhost:5000';
    const verificationLink = `${appUrl}/verify-email?token=${verificationToken}`;
    
    const msg = {
        to: to,
        from: 'noreply@militarytycoon.com', // Change to your verified sender
        subject: 'Verify Your Military Tycoon Value List Account',
        text: `Hello ${name}, please verify your email by clicking on this link: ${verificationLink}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #34495e;">Military Tycoon Value List</h1>
                </div>
                <div style="margin-bottom: 30px;">
                    <h2>Hello ${name},</h2>
                    <p>Thank you for registering with Military Tycoon Value List. To complete your registration and access all features, please verify your email address by clicking the button below:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationLink}" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email</a>
                    </div>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 4px;">${verificationLink}</p>
                    <p>This link will expire in 24 hours.</p>
                </div>
                <div style="text-align: center; margin-top: 30px; color: #7f8c8d; font-size: 12px;">
                    <p>This is an automated email. Please do not reply to this message.</p>
                    <p>&copy; 2023 Military Tycoon Value List. All rights reserved.</p>
                </div>
            </div>
        `
    };
    
    try {
        const response = await sgMail.send(msg);
        console.log('Verification email sent successfully');
        return response;
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw error;
    }
}

module.exports = {
    sendVerificationEmail
};