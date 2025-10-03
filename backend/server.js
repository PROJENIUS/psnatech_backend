const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer(); // handle multipart/form-data

app.use(cors()); // allow frontend connection
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // parse formData fields

// Route to generate serial number for PDF name
app.get('/generate-serial', (req, res) => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2); // e.g., '25'
  const month = String(now.getMonth() + 1).padStart(2, '0'); // e.g., '08'
  const serialPrefix = `${year}${month}`; // e.g., '2508'

  const filePath = path.join(__dirname, 'counter.json');

  let counterData = {};
  if (fs.existsSync(filePath)) {
    counterData = JSON.parse(fs.readFileSync(filePath));
  }

  const currentCount = counterData[serialPrefix] || 0;
  const nextCount = currentCount + 1;

  counterData[serialPrefix] = nextCount;
  fs.writeFileSync(filePath, JSON.stringify(counterData, null, 2));

  const serial = `${serialPrefix}${String(nextCount).padStart(2, '0')}`; // e.g., 250801
  res.json({ serial });
});

// Route to receive PDF and send email
app.post('/send-email', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      console.error("❌ No file received in request");
      return res.status(400).send("No file uploaded");
    }

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'projenius2025@gmail.com',
        pass: 'voakqbknlwjmsnwd', // Gmail App Password
      },
    });

    const mailOptions = {
      from: 'projenius2025@gmail.com',
      to: 'startupcell@psnacet.edu.in',
      subject: 'New Application Form Submitted',
      text: 'Please find the attached application form in PDF.',
      attachments: [
        {
          filename: req.body.filename || 'ApplicationForm.pdf',
          content: req.file.buffer,
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Email sent!');
    res.status(200).send('Email sent successfully!');
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    res.status(500).send('Error sending email: ' + error.message);
  }
});


// Start server
app.listen(5000, () => {
  console.log('🚀 Server started on http://localhost:5000');
});
