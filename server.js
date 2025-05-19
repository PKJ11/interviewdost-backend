// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080' // Adjust based on your frontend URL
}));
app.use(express.json());

// Email endpoint
app.post('/api/send-email', async (req, res) => {
  const { subject, html, text, recipients } = req.body;
  console.log('Recipients:', recipients); // Add this line


  // Validate input
  if (!subject || !html || !text || !recipients || !Array.isArray(recipients)) {
    return res.status(400).json({ 
      success: false,
      error: 'Missing required fields' 
    });
  }

  // Validate at least one recipient exists
  if (recipients.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No valid recipients provided'
    });
  }

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD,
      },
    });

    // Send mail to all recipients
    const info = await transporter.sendMail({
      from: `"InterviewDost" <${process.env.GMAIL_USER}>`,
      to: recipients.join(', '),
      subject,
      text,
      html,
    });

    console.log('Message sent: %s', info.messageId);
    res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully to all recipients' 
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send email',
      error: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});