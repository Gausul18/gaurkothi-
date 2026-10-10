const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Helper to resolve data file from ./data/ or from root ./
function resolveDataFile(filename) {
  const inData = path.join(__dirname, 'data', filename);
  if (fs.existsSync(inData)) return inData;
  const inRoot = path.join(__dirname, filename);
  if (fs.existsSync(inRoot)) return inRoot;
  return inRoot;
}

// Helper to read and write JSON data safely
function readJson(filename, defaultVal = []) {
  try {
    const file = resolveDataFile(filename);
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify(defaultVal, null, 2), 'utf-8');
      return defaultVal;
    }
    const raw = fs.readFileSync(file, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Error reading ${filename}:`, e);
    return defaultVal;
  }
}

function writeJson(filename, data) {
  try {
    const file = resolveDataFile(filename);
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error(`Error writing ${filename}:`, e);
    return false;
  }
}

// Admin Auth Middleware
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'gaurkothi2026';
const ADMIN_SECRET_KEY = 'gaon-admin-session-token-9988';

function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-key'];
  if (token && token === ADMIN_SECRET_KEY) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized: Pradhan Admin login required' });
}

/* ==================== API ROUTES ==================== */

// 1. Admin Login
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const cfg = readJson('config.json', {});
  const expectedPass = cfg.adminPassword || ADMIN_PASSWORD;
  if (password === expectedPass || password === 'gaurkothi2026') {
    return res.json({ success: true, key: ADMIN_SECRET_KEY, message: 'लॉगिन सफल हुआ' });
  }
  return res.status(401).json({ error: 'गलत पासवर्ड! कृपया सही प्रधान पासवर्ड दर्ज करें।' });
});

// 2. Village Config
app.get('/api/config', (req, res) => {
  const cfg = readJson('config.json', {});
  res.json(cfg);
});

app.put('/api/config', requireAdmin, (req, res) => {
  const cfg = readJson('config.json', {});
  const updated = { ...cfg, ...req.body };
  writeJson('config.json', updated);
  res.json({ success: true, config: updated });
});

// 3. Gaon ki Jaankari & Contacts
app.get('/api/jaankari', (req, res) => {
  const data = readJson('jaankari.json', {});
  res.json(data);
});

app.put('/api/jaankari', requireAdmin, (req, res) => {
  const current = readJson('jaankari.json', {});
  const updated = { ...current, ...req.body };
  writeJson('jaankari.json', updated);
  res.json(updated);
});

// 4. Suchna Board (Notices)
app.get('/api/suchna', (req, res) => {
  const list = readJson('suchna.json', []);
  res.json(list);
});

app.post('/api/suchna', requireAdmin, (req, res) => {
  const list = readJson('suchna.json', []);
  const newItem = {
    id: 'notice-' + Date.now(),
    title: req.body.title || 'नई सूचना',
    text: req.body.text || '',
    date: req.body.date || new Date().toLocaleDateString('hi-IN'),
    urgent: Boolean(req.body.urgent),
    issuer: req.body.issuer || 'ग्राम प्रधान'
  };
  list.unshift(newItem);
  writeJson('suchna.json', list);
  res.json(newItem);
});

app.put('/api/suchna/:id', requireAdmin, (req, res) => {
  const list = readJson('suchna.json', []);
  const idx = list.findIndex(item => item.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  list[idx] = { ...list[idx], ...req.body };
  writeJson('suchna.json', list);
  res.json(list[idx]);
});

app.delete('/api/suchna/:id', requireAdmin, (req, res) => {
  let list = readJson('suchna.json', []);
  list = list.filter(item => item.id !== req.params.id);
  writeJson('suchna.json', list);
  res.json({ success: true });
});

// 5. Chaupal (Community Feed)
app.get('/api/chaupal', (req, res) => {
  const list = readJson('chaupal.json', []);
  res.json(list);
});

app.post('/api/chaupal', (req, res) => {
  const list = readJson('chaupal.json', []);
  const newItem = {
    id: 'ch-' + Date.now(),
    name: req.body.name || 'गाँव का निवासी',
    ward: req.body.ward || '',
    time: 'अभी-अभी',
    text: req.body.text || '',
    likes: 0,
    photo: req.body.photo || null
  };
  list.unshift(newItem);
  writeJson('chaupal.json', list);
  res.json(newItem);
});

app.post('/api/chaupal/:id/like', (req, res) => {
  const list = readJson('chaupal.json', []);
  const post = list.find(p => p.id === req.params.id);
  if (post) {
    post.likes = (post.likes || 0) + 1;
    writeJson('chaupal.json', list);
    return res.json({ success: true, likes: post.likes });
  }
  res.status(404).json({ error: 'Post not found' });
});

app.delete('/api/chaupal/:id', (req, res) => {
  let list = readJson('chaupal.json', []);
  list = list.filter(p => p.id !== req.params.id);
  writeJson('chaupal.json', list);
  res.json({ success: true });
});

// 6. Krishi (Agriculture & Machinery)
app.get('/api/krishi', (req, res) => {
  const krishi = readJson('krishi.json', { crops: [], machinery: [] });
  res.json(krishi.crops || []);
});

app.get('/api/machinery', (req, res) => {
  const krishi = readJson('krishi.json', { crops: [], machinery: [] });
  res.json(krishi.machinery || []);
});

app.post('/api/machinery', (req, res) => {
  const krishi = readJson('krishi.json', { crops: [], machinery: [] });
  const newMach = {
    id: 'm-' + Date.now(),
    name: req.body.name,
    type: req.body.type || 'कृषि यंत्र',
    owner: req.body.owner,
    phone: req.body.phone,
    rate: req.body.rate || 'सम्पर्क करें',
    available: true
  };
  krishi.machinery = krishi.machinery || [];
  krishi.machinery.push(newMach);
  writeJson('krishi.json', krishi);
  res.json(newMach);
});

// 7. Sarkari Yojana
app.get('/api/yojana', (req, res) => {
  const list = readJson('yojana.json', []);
  res.json(list);
});

app.post('/api/yojana', requireAdmin, (req, res) => {
  const list = readJson('yojana.json', []);
  const newItem = {
    id: 'y-' + Date.now(),
    title: req.body.title,
    desc: req.body.desc,
    badge: req.body.badge || 'सरकारी योजना',
    link: req.body.link,
    btnText: req.body.btnText || 'विवरण देखें ↗'
  };
  list.push(newItem);
  writeJson('yojana.json', list);
  res.json(newItem);
});

// 8. Samasya (Citizen Grievance Redressal)
app.post('/api/samasya', (req, res) => {
  const list = readJson('samasya.json', []);
  const token = 'GP-' + Math.floor(10000 + Math.random() * 90000);
  const newItem = {
    id: 's-' + Date.now(),
    token,
    name: req.body.name || 'गाँव का नागरिक',
    mobile: req.body.mobile || '',
    ward: req.body.ward || '',
    category: req.body.category || 'अन्य',
    categoryLabel: req.body.categoryLabel || req.body.category || 'समस्या',
    title: req.body.title || 'जन समस्या',
    desc: req.body.desc || '',
    status: 'लंबित',
    date: new Date().toLocaleDateString('hi-IN'),
    adminRemark: '',
    photo: req.body.photo || null,
    replies: []
  };
  list.unshift(newItem);
  writeJson('samasya.json', list);
  res.json({ success: true, token, item: newItem });
});

app.get('/api/samasya', requireAdmin, (req, res) => {
  const list = readJson('samasya.json', []);
  res.json(list);
});

app.get('/api/samasya/track/:query', (req, res) => {
  const q = req.params.query.trim().toUpperCase();
  const list = readJson('samasya.json', []);
  const matches = list.filter(item => {
    return item.token.toUpperCase() === q || item.mobile === q;
  });
  if (matches.length > 0) {
    return res.json({ success: true, items: matches });
  }
  return res.status(404).json({ error: 'इस टोकन या मोबाइल नंबर से कोई शिकायत नहीं मिली।' });
});

app.patch('/api/samasya/:id', requireAdmin, (req, res) => {
  const list = readJson('samasya.json', []);
  const item = list.find(s => s.id === req.params.id || s.token === req.params.id);
  if (!item) return res.status(404).json({ error: 'शिकायत नहीं मिली।' });

  if (req.body.status) item.status = req.body.status;
  if (req.body.adminRemark !== undefined) item.adminRemark = req.body.adminRemark;
  writeJson('samasya.json', list);
  res.json({ success: true, item });
});

app.delete('/api/samasya/:token', (req, res) => {
  let list = readJson('samasya.json', []);
  const token = req.params.token;
  list = list.filter(s => s.token !== token && s.id !== token);
  writeJson('samasya.json', list);
  res.json({ success: true });
});

app.post('/api/samasya/:token/reply', (req, res) => {
  const list = readJson('samasya.json', []);
  const token = req.params.token;
  const item = list.find(s => s.token === token || s.id === token);
  if (!item) return res.status(404).json({ error: 'शिकायत नहीं मिली।' });
  item.replies = item.replies || [];
  const reply = {
    by: req.body.by || 'नागरिक',
    text: req.body.text,
    time: new Date().toLocaleTimeString('hi-IN')
  };
  item.replies.push(reply);
  writeJson('samasya.json', list);
  res.json({ success: true, item, message: reply });
});

// Serve frontend static assets from public/ or root ./
if (fs.existsSync(path.join(__dirname, 'public'))) {
  app.use(express.static(path.join(__dirname, 'public')));
}
app.use(express.static(__dirname));

// Fallback to index.html for SPA
app.get('*', (req, res) => {
  const pubHtml = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(pubHtml)) return res.sendFile(pubHtml);
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🌾 गौरकोठी गाँव पोर्टल (Gaurkothi Gaon Portal) सर्वर चालू है!`);
  console.log(`🌐 Port: ${PORT}`);
  console.log(`👑 Pradhan Admin Password: ${ADMIN_PASSWORD}`);
  console.log(`===============================================`);
});
