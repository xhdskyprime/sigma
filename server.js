import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import cron from 'node-cron';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import pool from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import fs from 'fs';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Ensure uploads directory and category subfolders exist
const uploadsDir = path.join(__dirname, 'uploads');
const categoryFolders = ['undangan', 'nota_dinas', 'surat_tugas', 'lainnya'];
categoryFolders.forEach(folder => {
  const dir = path.join(uploadsDir, folder);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Serve static PDF uploads with proper PDF headers & CORS
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/pdf');
  next();
}, express.static(uploadsDir));

const SECRET_KEY = process.env.SECRET_KEY || 'rsud_rahasia_tigaraksax';

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });
    req.user = user;
    next();
  });
};

// Database Availability Helper
let dbAvailable = null;

async function isDbAvailable() {
  if (dbAvailable !== null) return dbAvailable;
  try {
    const client = await pool.connect();
    client.release();
    dbAvailable = true;
    console.log('[Storage] Connected to PostgreSQL database.');
  } catch (err) {
    dbAvailable = false;
    console.log('[Storage] PostgreSQL not available. Running in local JSON file mode.');
  }
  return dbAvailable;
}

// Database Helpers with Instant JSON Fallback
async function getSettings() {
  if (await isDbAvailable()) {
    try {
      const res = await pool.query('SELECT * FROM settings WHERE id = 1');
      if (res.rows.length > 0) {
        const row = res.rows[0];
        let recipients = row.email_recipients;
        if (typeof recipients === 'string') {
          try { recipients = JSON.parse(recipients); } catch (e) { recipients = []; }
        }
        let announcements = row.announcements;
        if (typeof announcements === 'string') {
          try { announcements = JSON.parse(announcements); } catch (e) { announcements = []; }
        }
        return {
          emailSender: row.email_sender || '',
          emailPassword: row.email_password || '',
          emailRecipients: recipients || [],
          emailSchedule: row.email_schedule || '07:00',
          mobilePin: row.mobile_pin || '',
          announcements: announcements || []
        };
      }
    } catch (err) {
      dbAvailable = false;
    }
  }

  const SETTINGS_FILE = path.join(__dirname, 'data', 'settings.json');
  if (fs.existsSync(SETTINGS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
      return {
        emailSender: data.emailSender || '',
        emailPassword: data.emailPassword || '',
        emailRecipients: data.emailRecipients || [],
        emailSchedule: data.emailSchedule || '07:00',
        mobilePin: data.mobilePin || '',
        announcements: data.announcements || []
      };
    } catch (e) {
      console.error('Error reading settings.json:', e);
    }
  }
  return { emailSender: '', emailPassword: '', emailRecipients: [], emailSchedule: '07:00', mobilePin: '', announcements: [] };
}

async function getAgendas() {
  if (await isDbAvailable()) {
    try {
      const res = await pool.query('SELECT * FROM agendas ORDER BY date ASC, id ASC');
      return res.rows.map(a => ({
        id: Number(a.id),
        title: a.title,
        date: a.date,
        timeStart: a.time_start,
        timeEnd: a.time_end,
        location: a.location,
        pic: a.pic,
        unit: a.unit,
        attendees: a.attendees,
        category: a.category,
        status: a.status,
        color: a.color,
        catColor: a.cat_color,
        note: a.note || '',
        admin: typeof a.admin === 'string' ? JSON.parse(a.admin) : (a.admin || {}),
        adminFiles: typeof a.admin_files === 'string' ? JSON.parse(a.admin_files) : (a.admin_files || {})
      }));
    } catch (err) {
      dbAvailable = false;
    }
  }

  const AGENDAS_FILE = path.join(__dirname, 'data', 'agendas.json');
  if (fs.existsSync(AGENDAS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(AGENDAS_FILE, 'utf8'));
      console.log(`[Storage] Loaded ${data.length} agendas from agendas.json`);
      return data;
    } catch (e) {
      console.error('Error reading agendas.json:', e);
    }
  }
  return [];
}

async function saveAgendas(agendasData) {
  if (await isDbAvailable()) {
    try {
      const client = await pool.connect();
      const cleanStr = (s) => (s ? String(s).replace(/[\r\n]+/g, ' ').trim() : '');

      try {
        await client.query('BEGIN');
        for (const a of agendasData) {
          const numericId = Number(a.id);
          await client.query(
            `INSERT INTO agendas (id, title, date, time_start, time_end, location, pic, unit, attendees, category, status, color, cat_color, note, admin, admin_files)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
             ON CONFLICT (id) DO UPDATE SET
               title = EXCLUDED.title,
               date = EXCLUDED.date,
               time_start = EXCLUDED.time_start,
               time_end = EXCLUDED.time_end,
               location = EXCLUDED.location,
               pic = EXCLUDED.pic,
               unit = EXCLUDED.unit,
               attendees = EXCLUDED.attendees,
               category = EXCLUDED.category,
               status = EXCLUDED.status,
               color = EXCLUDED.color,
               cat_color = EXCLUDED.cat_color,
               note = EXCLUDED.note,
               admin = EXCLUDED.admin,
               admin_files = EXCLUDED.admin_files`,
            [
              numericId,
              cleanStr(a.title),
              a.date,
              a.timeStart || '',
              a.timeEnd || '',
              cleanStr(a.location),
              cleanStr(a.pic),
              cleanStr(a.unit),
              cleanStr(a.attendees),
              a.category || '',
              a.status || '',
              a.color || '',
              a.catColor || '',
              a.note || '',
              JSON.stringify(a.admin || {}),
              JSON.stringify(a.adminFiles || {})
            ]
          );
        }
        await client.query('COMMIT');
        return;
      } catch (err) {
        await client.query('ROLLBACK');
        dbAvailable = false;
      } finally {
        client.release();
      }
    } catch (err) {
      dbAvailable = false;
    }
  }

  const AGENDAS_FILE = path.join(__dirname, 'data', 'agendas.json');
  let existing = [];
  if (fs.existsSync(AGENDAS_FILE)) {
    try { existing = JSON.parse(fs.readFileSync(AGENDAS_FILE, 'utf8')); } catch (e) {}
  }
  const map = new Map(existing.map(item => [item.id, item]));
  agendasData.forEach(item => map.set(item.id, item));
  const merged = Array.from(map.values());
  fs.writeFileSync(AGENDAS_FILE, JSON.stringify(merged, null, 2), 'utf8');
}

// --- AUTH ROUTES ---
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    let user = null;

    if (await isDbAvailable()) {
      try {
        const userRes = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (userRes.rows.length > 0) {
          user = userRes.rows[0];
        }
      } catch (dbErr) {
        dbAvailable = false;
      }
    }

    if (!user) {
      const SETTINGS_FILE = path.join(__dirname, 'data', 'settings.json');
      if (fs.existsSync(SETTINGS_FILE)) {
        try {
          const settingsData = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
          if (settingsData.users) {
            const found = settingsData.users.find(u => u.username === username);
            if (found) user = found;
          }
        } catch (e) {}
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Username atau password salah' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Username atau password salah' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name, initial: user.initial },
      SECRET_KEY,
      { expiresIn: '24h' }
    );
    res.json({ token, user: { role: user.role, name: user.name, initial: user.initial } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/change-password', authenticateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    let user = null;

    if (await isDbAvailable()) {
      try {
        const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
        if (userRes.rows.length > 0) user = userRes.rows[0];
      } catch (dbErr) {
        dbAvailable = false;
      }
    }

    if (!user) {
      const SETTINGS_FILE = path.join(__dirname, 'data', 'settings.json');
      if (fs.existsSync(SETTINGS_FILE)) {
        try {
          const settingsData = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
          if (settingsData.users) {
            user = settingsData.users.find(u => u.id === req.user.id);
          }
        } catch (e) {}
      }
    }

    if (!user) return res.status(404).json({ error: 'User not found' });

    const validPassword = bcrypt.compareSync(oldPassword, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Kata sandi lama salah' });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    if (await isDbAvailable()) {
      try {
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, req.user.id]);
      } catch (dbErr) {
        dbAvailable = false;
      }
    }

    if (!dbAvailable) {
      const SETTINGS_FILE = path.join(__dirname, 'data', 'settings.json');
      if (fs.existsSync(SETTINGS_FILE)) {
        try {
          const settingsData = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
          if (settingsData.users) {
            const u = settingsData.users.find(x => x.id === req.user.id);
            if (u) u.password = hashedPassword;
            fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settingsData, null, 2), 'utf8');
          }
        } catch (e) {}
      }
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- SERVER-SENT EVENTS (SSE) REAL-TIME PUSH BROADCASTER ---
let sseClients = [];

app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  sseClients.push(res);

  // Send initial connection event
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: Date.now() })}\n\n`);

  req.on('close', () => {
    sseClients = sseClients.filter(client => client !== res);
  });
});

const broadcastEvent = (eventType, data = {}) => {
  sseClients.forEach(client => {
    client.write(`data: ${JSON.stringify({ type: eventType, data, timestamp: Date.now() })}\n\n`);
  });
};

// --- API ROUTES ---
app.get('/api/agendas', async (req, res) => {
  const agendas = await getAgendas();
  res.json(agendas);
});

app.post('/api/agendas', authenticateToken, async (req, res) => {
  try {
    await saveAgendas(req.body);
    broadcastEvent('AGENDA_UPDATED');
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving agendas:', err);
    res.status(500).json({ error: 'Failed to save agendas' });
  }
});

app.post('/api/agendas/single', authenticateToken, async (req, res) => {
  try {
    await saveAgendas([req.body]);
    broadcastEvent('AGENDA_UPDATED');
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving single agenda:', err);
    res.status(500).json({ error: 'Failed to save agenda' });
  }
});

app.delete('/api/agendas/:id', authenticateToken, async (req, res) => {
  const targetId = Number(req.params.id);
  try {
    await pool.query('DELETE FROM agendas WHERE id = $1', [targetId]);
  } catch (dbErr) {
    const AGENDAS_FILE = path.join(__dirname, 'data', 'agendas.json');
    if (fs.existsSync(AGENDAS_FILE)) {
      try {
        const existing = JSON.parse(fs.readFileSync(AGENDAS_FILE, 'utf8'));
        const filtered = existing.filter(a => Number(a.id) !== targetId);
        fs.writeFileSync(AGENDAS_FILE, JSON.stringify(filtered, null, 2), 'utf8');
      } catch (e) {}
    }
  }
  broadcastEvent('AGENDA_UPDATED');
  res.json({ success: true });
});

// --- FILE UPLOAD & DELETE ROUTES ---
app.post('/api/upload-pdf', authenticateToken, async (req, res) => {
  try {
    const { agendaId, field, fileName, fileData } = req.body;
    if (!agendaId || !field || !fileData) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Determine category subfolder
    let folderName = 'lainnya';
    if (field === 'undangan') folderName = 'undangan';
    else if (field === 'notaDinas') folderName = 'nota_dinas';
    else if (field === 'suratTugas') folderName = 'surat_tugas';

    const targetDir = path.join(uploadsDir, folderName);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const safeOriginalName = (fileName || 'dokumen.pdf').replace(/[^a-zA-Z0-9_.-]/g, '_');
    const uniqueFileName = `${field}_agenda${agendaId}_${Date.now()}_${safeOriginalName}`;
    const filePathOnDisk = path.join(targetDir, uniqueFileName);

    const base64Data = fileData.replace(/^data:application\/pdf;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePathOnDisk, buffer);

    const relativeUrl = `/uploads/${folderName}/${uniqueFileName}`;
    console.log(`[Upload] Saved PDF to disk: ${filePathOnDisk} (${buffer.length} bytes)`);

    res.json({
      success: true,
      fileInfo: {
        name: fileName || safeOriginalName,
        url: relativeUrl
      }
    });
  } catch (err) {
    console.error('Error uploading file:', err);
    res.status(500).json({ error: 'Failed to save file to server uploads folder' });
  }
});

app.post('/api/delete-pdf', authenticateToken, async (req, res) => {
  try {
    const { fileUrl } = req.body;
    if (fileUrl && typeof fileUrl === 'string' && fileUrl.startsWith('/uploads/')) {
      const diskPath = path.join(__dirname, fileUrl);
      if (fs.existsSync(diskPath)) {
        fs.unlinkSync(diskPath);
        console.log(`[Delete] Removed file from disk: ${diskPath}`);
      }
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting file:', err);
    res.status(500).json({ error: 'Failed to delete file from disk' });
  }
});

app.get('/api/settings', async (req, res) => {
  const settings = await getSettings();
  res.json(settings);
});

app.post('/api/verify-pin', async (req, res) => {
  try {
    const { pin } = req.body;
    const settings = await getSettings();
    if (!settings.mobilePin || settings.mobilePin.trim() === '') {
      return res.json({ valid: true });
    }
    const isValid = String(pin).trim() === String(settings.mobilePin).trim();
    res.json({ valid: isValid });
  } catch (err) {
    console.error('Error verifying PIN:', err);
    res.status(500).json({ error: 'Failed to verify PIN' });
  }
});

app.post('/api/settings', authenticateToken, async (req, res) => {
  try {
    const { emailSender, emailPassword, emailRecipients, emailSchedule, mobilePin, announcements } = req.body;
    try {
      await pool.query(
        `INSERT INTO settings (id, email_sender, email_password, email_recipients, email_schedule, mobile_pin, announcements)
         VALUES (1, $1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
         email_sender = EXCLUDED.email_sender,
         email_password = EXCLUDED.email_password,
         email_recipients = EXCLUDED.email_recipients,
         email_schedule = EXCLUDED.email_schedule,
         mobile_pin = EXCLUDED.mobile_pin,
         announcements = EXCLUDED.announcements`,
        [
          emailSender !== undefined ? emailSender : '',
          emailPassword !== undefined ? emailPassword : '',
          JSON.stringify(emailRecipients || []),
          emailSchedule !== undefined ? emailSchedule : '07:00',
          mobilePin !== undefined ? mobilePin : '',
          JSON.stringify(announcements || [])
        ]
      );
    } catch (dbErr) {
      const SETTINGS_FILE = path.join(__dirname, 'data', 'settings.json');
      let current = {};
      if (fs.existsSync(SETTINGS_FILE)) {
        try { current = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')); } catch (e) {}
      }
      current.emailSender = emailSender !== undefined ? emailSender : (current.emailSender || '');
      current.emailPassword = emailPassword !== undefined ? emailPassword : (current.emailPassword || '');
      current.emailRecipients = emailRecipients !== undefined ? emailRecipients : (current.emailRecipients || []);
      current.emailSchedule = emailSchedule !== undefined ? emailSchedule : (current.emailSchedule || '07:00');
      current.mobilePin = mobilePin !== undefined ? mobilePin : (current.mobilePin || '');
      current.announcements = announcements !== undefined ? announcements : (current.announcements || []);
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(current, null, 2), 'utf8');
    }
    res.json({ success: true });
    broadcastEvent('SETTINGS_UPDATED');
    setupCronJob();
  } catch (err) {
    console.error('Error saving settings:', err);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

app.post('/api/test-email', authenticateToken, async (req, res) => {
  try {
    const success = await sendDailyEmail(true);
    res.json({ success });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- EMAIL LOGIC ---
let currentCronTask = null;

const sendDailyEmail = async (isTest = false) => {
  const settings = await getSettings();
  if (!settings.emailSender || !settings.emailPassword || !settings.emailRecipients || settings.emailRecipients.length === 0) {
    console.log('Skipping email: Settings incomplete.');
    return false;
  }

  const agendas = await getAgendas();
  const today = new Date();
  const todayStr = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  
  const todayAgendas = agendas.filter(a => a.date === todayStr);

  if (todayAgendas.length === 0 && !isTest) {
    console.log('Skipping email: No agendas for today.');
    return true; 
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: settings.emailSender,
      pass: settings.emailPassword
    }
  });

  const generateHtml = () => {
    let html = `<h2>Agenda RSUD Hari Ini (${today.toLocaleDateString('id-ID')})</h2>`;
    if (todayAgendas.length === 0) {
      html += `<p>Tidak ada agenda kegiatan untuk hari ini.</p>`;
    } else {
      html += `<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; font-family: sans-serif;">
        <thead style="background-color: #0ea5e9; color: white;">
          <tr>
            <th>Waktu</th>
            <th>Kegiatan</th>
            <th>Lokasi</th>
            <th>PIC / Hadir</th>
            <th>Kategori</th>
          </tr>
        </thead>
        <tbody>
          ${todayAgendas.map(a => `
            <tr>
              <td>${a.timeStart} - ${a.timeEnd}</td>
              <td><b>${a.title}</b></td>
              <td>${a.location}</td>
              <td>${a.attendees || a.pic || '-'}</td>
              <td>${a.category}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>`;
    }
    return html;
  };

  const mailOptions = {
    from: `"Sistem Agenda RSUD" <${settings.emailSender}>`,
    to: settings.emailRecipients.join(', '),
    subject: isTest ? 'Test: Notifikasi Agenda Harian RSUD' : `Notifikasi Agenda Harian RSUD - ${today.toLocaleDateString('id-ID')}`,
    html: generateHtml()
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', mailOptions.to);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    if (isTest) throw error;
    return false;
  }
};

const setupCronJob = async () => {
  const settings = await getSettings();
  if (currentCronTask) {
    currentCronTask.stop();
  }

  if (settings.emailSchedule) {
    const [hour, minute] = settings.emailSchedule.split(':');
    const cronExpression = `${minute} ${hour} * * *`;
    
    currentCronTask = cron.schedule(cronExpression, () => {
      console.log('Running daily email cron task at', new Date().toISOString());
      sendDailyEmail();
    });
    console.log(`Cron job scheduled for ${settings.emailSchedule}`);
  }
};

// Serve static assets from built Vite frontend
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback all non-API and non-uploads routes to index.html (SPA routing)
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3008;
app.listen(PORT, async () => {
  console.log(`Backend server running on port ${PORT}`);
  await setupCronJob();
});
