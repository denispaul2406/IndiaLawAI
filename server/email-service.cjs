const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

// Gmail SMTP configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || '*',
    pass: process.env.SMTP_PASS || '*',
  },
  tls: {
    rejectUnauthorized: false,
  },
});

app.post('/send-report', async (req, res) => {
  try {
    const { to, subject, html } = req.body;

    if (!to) {
      return res.status(400).json({ success: false, message: 'Recipient email is required' });
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || 'denispaul2601@gmail.com',
      to,
      subject: subject || 'IndiaLawAI Compliance Report',
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    
    res.json({ 
      success: true, 
      message: 'Email sent successfully',
      messageId: info.messageId
    });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to send email'
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'IndiaLawAI Email Service' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Email service running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

