
// server.js
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS
// For development
const corsOptions = {
    origin: 'https://engahmedmoustafasadek.github.io/portfolio/', // Replace with your actual GitHub Pages URL
    methods: ['POST'],
    allowedHeaders: ['Content-Type']
  };
  
app.use(cors(corsOptions));


// Configure rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs per IP
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiting to contact endpoint
app.use('/api/contact', limiter);

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE, // 'gmail' or other service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
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
    // Compose email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'ahmed.moustafa9813@gmail.com', // Your email
      replyTo: email,
      subject: subject ? `Portfolio Contact: ${subject}` : 'New message from your portfolio',
      html: `
        <h3>New message from your portfolio</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${subject ? `<p><strong>Subject:</strong> ${subject}</p>` : ''}
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `
    };
    
    // Send email
    await transporter.sendMail(mailOptions);
    
    res.status(200).json({ success: true, message: 'Message sent successfully!' });
  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({ success: false, message: 'Failed to send message. Please try again later.' });
  }
});

// Basic health check endpoint
app.get('/', (req, res) => {
  res.send('Email service is running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});