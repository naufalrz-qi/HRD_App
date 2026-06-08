const express = require('express');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const multer = require('multer');
const fs = require('fs');

const app = express();
const port = 5011;

// Setup Multer for file uploads
const upload = multer({ dest: 'uploads/' });

app.use(express.json());

// Initialize WhatsApp Client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

let isClientReady = false;

client.on('qr', (qr) => {
    console.log('Scan QR Code ini dengan WhatsApp Anda:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('WhatsApp Client is ready!');
    isClientReady = true;
});

client.on('disconnected', (reason) => {
    console.log('WhatsApp Client was disconnected', reason);
    isClientReady = false;
});

client.initialize();

// Helper to format phone number
const formatPhone = (phone) => {
    let formatted = phone.replace(/\D/g, '');
    if (formatted.startsWith('0')) {
        formatted = '62' + formatted.substring(1);
    }
    return `${formatted}@c.us`;
};

// Route to send text message
app.post('/send-message', async (req, res) => {
    if (!isClientReady) {
        return res.status(503).json({ success: false, message: 'WhatsApp Client is not ready yet.' });
    }

    const { to, text } = req.body;
    if (!to || !text) {
        return res.status(400).json({ success: false, message: 'Missing "to" or "text" in body.' });
    }

    const chatId = formatPhone(to);

    try {
        await client.sendMessage(chatId, text);
        console.log(`Message sent to ${to}`);
        res.json({ success: true, message: 'Message sent successfully.' });
    } catch (error) {
        console.error('Failed to send message:', error);
        res.status(500).json({ success: false, message: error.toString() });
    }
});

// Route to send document
app.post('/send-document', upload.single('file'), async (req, res) => {
    if (!isClientReady) {
        return res.status(503).json({ success: false, message: 'WhatsApp Client is not ready yet.' });
    }

    const { to, caption, filename } = req.body;
    const file = req.file;

    if (!to || !file) {
        return res.status(400).json({ success: false, message: 'Missing "to" or "file".' });
    }

    const chatId = formatPhone(to);

    try {
        const finalFilename = filename || file.originalname || 'document.xlsx';
        const newPath = file.path + '_' + finalFilename;
        
        // Rename the file to have the correct filename and extension on disk
        fs.renameSync(file.path, newPath);

        // Read media directly from the properly named file
        const media = MessageMedia.fromFilePath(newPath);
        
        // EXPLICITLY OVERRIDE PROPERTIES to prevent 'Untitled' bug in whatsapp-web.js
        media.mimetype = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        media.filename = finalFilename;

        await client.sendMessage(chatId, media, { 
            caption: caption || '',
            sendMediaAsDocument: true
        });
        console.log(`Document sent to ${to} as ${media.filename}`);
        
        // Clean up temp file
        fs.unlinkSync(newPath);

        res.json({ success: true, message: 'Document sent successfully.' });
    } catch (error) {
        console.error('Failed to send document:', error);
        // Clean up fallback
        if (file && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
        res.status(500).json({ success: false, message: error.toString() });
    }
});

app.listen(port, () => {
    console.log(`WhatsApp API Server running on http://localhost:${port}`);
});
