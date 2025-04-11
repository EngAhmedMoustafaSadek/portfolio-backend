// api/contact.js
const nodemailer = require('nodemailer');
const { Redis } = require('@upstash/redis');

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Rate limiting constants
const RATE_LIMIT_WINDOW = 15 * 60; // 15 minutes (in seconds)
const RATE_LIMIT_MAX_REQUESTS = 5; // Max 5 requests in the time window

async function checkRateLimit(ip) {
  try {
    // Get current count for this IP
    const key = `ratelimit:${ip}`;
    const count = await redis.incr(key);
    
    // Set expiry on first request
    if (count === 1) {
      await redis.expire(key, RATE_LIMIT_WINDOW);
    }
    
    // Return whether the request is allowed
    return count <= RATE_LIMIT_MAX_REQUESTS;
  } catch (error) {
    console.error('Rate limit check error:', error);
    // If there's an error checking rate limit, allow the request to proceed
    return true;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // Get client IP (Vercel provides it in headers)
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  // Rate limiting check
  const allowed = await checkRateLimit(ip);
  if (!allowed) {
    return res.status(429).json({ success: false, message: 'Too many requests, please try again later.' });
  }

  const { name, email, subject, message } = req.body;

  // Basic input validation
  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'Please fill in all required fields' });
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
  }

  try {
    // Configure email transporter with environment variables
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE, // e.g., 'gmail'
      auth: {
        user: process.env.EMAIL_USER, // Your email
        pass: process.env.EMAIL_PASSWORD, // Your email password
      },
    });

    // Compose the email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'ahmed.moustafa9813@gmail.com', // Your email where the message will be sent
      replyTo: email,
      subject: subject ? `Portfolio Contact: ${subject}` : 'New message from your portfolio',
      html: `
        <h3>New message from your portfolio</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${subject ? `<p><strong>Subject:</strong> ${subject}</p>` : ''}
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: 'Message sent successfully!' });
  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({ success: false, message: 'Failed to send message. Please try again later.' });
  }
}
