// api/contact.js
const nodemailer = require('nodemailer');

// In-memory rate limit store (for simplicity, use a more persistent solution like Redis for production)
const rateLimitStore = {};

const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 5; // Max 5 requests in the time window

function rateLimit(req) {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  // If there's no IP stored, initialize it
  if (!rateLimitStore[ip]) {
    rateLimitStore[ip] = { count: 1, firstRequestTime: Date.now() };
    return true;
  }

  const elapsedTime = Date.now() - rateLimitStore[ip].firstRequestTime;

  // If the time window has passed, reset the counter
  if (elapsedTime > RATE_LIMIT_WINDOW) {
    rateLimitStore[ip] = { count: 1, firstRequestTime: Date.now() };
    return true;
  }

  // If the count exceeds the limit, deny the request
  if (rateLimitStore[ip].count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  // Otherwise, increment the count and allow the request
  rateLimitStore[ip].count += 1;
  return true;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // Rate limiting check
  if (!rateLimit(req)) {
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
