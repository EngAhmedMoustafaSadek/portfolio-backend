// const nodemailer = require('nodemailer');

// module.exports = async (req, res) => {
//   // Set CORS headers
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

//   // Handle preflight requests
//   if (req.method === 'OPTIONS') {
//     return res.status(200).end();
//   }

//   // Only allow POST requests
//   if (req.method !== 'POST') {
//     return res.status(405).json({ success: false, message: 'Method not allowed' });
//   }

//   const { name, email, subject, message } = req.body;

//   // Basic input validation
//   if (!name || !email || !message) {
//     return res.status(400).json({ success: false, message: 'Please fill in all required fields' });
//   }

//   // Email format validation
//   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//   if (!emailRegex.test(email)) {
//     return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
//   }

//   try {
//     // Configure email transporter
//     const transporter = nodemailer.createTransport({
//       service: process.env.EMAIL_SERVICE, // e.g., 'gmail'
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASSWORD,
//       },
//     });

//     // Compose the email
//     const mailOptions = {
//       from: process.env.EMAIL_USER,
//       to: 'ahmed.moustafa9813@gmail.com',
//       replyTo: email,
//       subject: subject ? `Portfolio Contact: ${subject}` : 'New message from your portfolio',
//       html: `
//         <h3>New message from your portfolio</h3>
//         <p><strong>Name:</strong> ${name}</p>
//         <p><strong>Email:</strong> ${email}</p>
//         ${subject ? `<p><strong>Subject:</strong> ${subject}</p>` : ''}
//         <p><strong>Message:</strong></p>
//         <p>${message.replace(/\n/g, '<br>')}</p>
//       `,
//     };

//     // Send the email
//     await transporter.sendMail(mailOptions);
//     return res.status(200).json({ success: true, message: 'Message sent successfully!' });
//   } catch (error) {
//     console.error('Email error:', error);
//     return res.status(500).json({ success: false, message: 'Failed to send message. Please try again later.' });
//   }
// };

// pages/api/contact.js
export default function handler(req, res) {
  console.log('Request received:', req.method);
  res.status(200).json({ message: 'API is working!' });
}
