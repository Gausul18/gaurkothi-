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
  if (token && (token === ADMIN_SECRET_KEY || token === 'gaurkothi2026' || token === ADMIN_PASSWORD)) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized: Pradhan Admin login required' });
}

/* ==================== PWA ROUTES & EMBEDDED ICONS ==================== */
const ICON_192_B64 = "iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAIAAADdvvtQAAADwklEQVR4nO3cIW5dRxTH4eeoqyixFFrUFbgosCA0hl1VVFpaUFjUHZSElARmHQGJHMeWn933v3fmnDvfx2PNPfPTyUhWcnV9c3uCS72afQB6ExARAREREBEBEREQEQERERARAREREBEBEREQEQERERARAREREBEBEREQEQERERARAREREBEBEREQEQERERARAREREBEBEREQEQERERARAREREBEBERHQM/5+9+/sI5QmoHO+1KOhMwT0pPvdaOgpV/6b38fO5PLmj59HnqQ+G+ih88vGKnpAQN95SR8auk9A37y8DA3dEdBX/7cJDX3hEZ2msPizevUNlC+SxVfR0gFtdfcrN7RuQNve+rINLRrQHve9ZkPLPaIHXPNSz+q1NtCYJbHUKloooJH3uk5DqwQ0/kYXaWiJgGbd5QoNHfwRXeQKD/ysPvIGKlLPqdJJNnfYgKrdWbXzbOWYAdW8rZqnCh0woMr3VPlslznUI7rR9RzmWX2cDdSonlO3055xkIA63kfHMz92hID63kTfk99pH1D3O+h+/saP6O6jf6Dps7rrBjpYPae2X9QyoKazflbH7+oXUMcpv1y7r2sWULv5XqDXN7Z5RPca6yZaPKt7bKAF6zk1+eoGAbWY407qf3v1gOpPcG/FJ1A6oOKzG6byHIo+oiuPbKKCz+qKG0g9Tyk4mXIBFZxRKdXmUyugatOpqdSUCgVUai7F1ZlViUd0nXG0M/1ZPX8DqScxfXqTA5r+/Qcwd4YzA1LPViZOclpA6tnWrHlOeERLZ1eDn9WjN5B69jZ4wkMDUs8YI+c8LiD1jDRs2oMCUs94Y2a++yNaOtPt+qzeN6DL6vnx7V+bn+QwPv356wV/ar+GdvwrzO6pY7+7+GGnn3sKqv/wdtuDHMr0354+MP+XqbQmICICIiIgIgIiIiAiAiIiICICIiIgIgIiIiAiAiIiICICIiIgIgIiIiAiAiIiICICIiIgIgIiIiAiAiIiICICIrLjv40v6/Uvv+33wz/+8/t+P7wgG4iIgIgIiIiAiAiIiICICIiIgIgIiIiAiAiIiICICIiIgIgIiIiAiAiIiICICIiIgIgIiIiAiAiIiICICIiIgIgIiIiAiAiIiICICIiIgIgIiIiAiAiIiICICIiIgIgIiIiAiAiIiICIXF3f3M4+A43ZQEQERERARAREREBEBEREQEQERERARAREREBEBEREQEQERERARAREREBEBEREQEQEROTqv/c/zT4DjdlARAREREBEBEREQEQERERARD4DYLzfGpp3yiUAAAAASUVORK5CYII=";
const ICON_512_B64 = "iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAIAAAB7GkOtAAALPUlEQVR4nO3aPZIcSRmA4Raxp8DZCFwsTrBYmBjrIpNTEbi4GJhY3AAHBweTc2DMxu6wkkbd01WVP+/znKCmKvN7lcr+8O13H28A9Pxi9AMAMIYAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAkPb3P/xz9CPAMAJA18v01wCyBICo13NfA2j68O13H0c/A1zqjXH/u7/85songbGcAGh5+x/7jgKkCAAh98x3DaBDAKi4f7JrABECQMKjM10DKHAJzOaeHOWuhdmYEwA7e/4f8o4CbEwA2NZRs1sD2JUAsKdjp7YGsCUBYENnzGsNYD8CwG7Om9QawGb8Coh9XDag/TSIPTgBsIkr/3nuKMAeBIAdXD+RNYANCADLGzWLNYDVCQBrGzuFNYCluQRmVVMNX9fCrMgJgCVNNf1v8z0P3EMAWM+c03bOp4I3CACLmXnOzvxs8CkBYCXzT9j5nxB+5BKYNSw3WF0LMz8nABaw3PS/rfnM1AgAs1t3kq775EQIAFNbfYau/vzsTQCY1x7Tc4+/gi25BGZGWw5N18LMxgmA6Ww5/W/7/l2sSwCYy95Tcu+/juUIABMpzMfC38gqBIBZdCZj5y9lcgLAFGozsfb3Mie/AmKw+Cj00yAGcgJgpPj0v3kDDCUADGP2vfAeGEUAGMPUe83bYAgBYADz7lPeCddzCcyljLmvci3MZZwAuI7pfw9vicsIABcx1+7nXXENAeAKJtqjvDEuIACczix7H++Ns7kE5kRG2CFcC3MSJwDOYvofxZvkJALAKcysY3mfnEEAOJ5pdQZvlcMJAAczp87j3XIsl8Acxni6jGthDuEEwDFM/yt52xxCADiAeXQ975znCQDPMolG8eZ5kgDwFDNoLO+fZwgA72f6zMBX4N38Coj3MHQm5KdBPMoJgIeZ/nPyXXiUAPAYU2Zmvg4PEQAeYL7MzzfifgLAvUyWVfhS3MklMF9noCzKtTBvcwLgK0z/dfl2vE0AeIsJsjpfkDcIAF9kduzBd+RLBIDPMzV24mvyWS6B+TnDYmOuhXnNCYD/Y/rvzfflNQHgJ6ZDga/MjwSAH5gLHb41LwSA281E6PHFubkExiCIcy1c5gSQZvpjDZQJQJedzwsrIUsAoux5XrMemgSgyG7nU1ZFkADk2Od8ibVR41dAIbY3d/LToAgngArTn/tZLRECkGA/8yhrpkAA9mcn8z5WzvYEYHP2MM+wfvbmEnhbti4Hci28JSeAPZn+HMuK2pIAbMhe5QzW1X4EYDd2KeexujYjAFuxPzmbNbYTl8CbsC25mGvhDTgB7MD053pW3QYEYHn2IaNYe6sTgLXZgYxlBS5NABZm7zED63BdLoGXZMsxIdfCy3ECWI/pz5yszOUIwGLsMWZmfa5FAFZidzE/q3QhArAM+4pVWKurEIA12FGsxYpdgl8Bzc5GYml+GjQzJ4Cpmf6szhqemQDMy85hD1bytARgUvYMO7Ge5yQAM7Jb2I9VPSGXwHOxSdiea+F5OAFMxPSnwDqfhwDMwq6gw2qfhABMwX6gxpqfgQCMZyfQZOUP5xJ4JBsAbq6Fx3ECGMb0hxf2wigCMIYVD6/ZEUMIwADWOnzKvrieAFzNKocvsTsu5hL4OhY33Mm18DWcAC5i+sP97JdrCMAVrGZ4lF1zAQE4nXUM72PvnE0AzmUFwzPsoFMJwImsXXiefXQevwI6hSULh/PToMM5ARzP9Icz2FmHE4CDWaNwHvvrWAJwJKsTzmaXHUgADmNdwjXstaO4BD6A5QhDuBZ+khPAs0x/GMXue5IAPMX6g7HswWcIwPtZeTADO/HdBOCdrDmYh/34Pi6BH2apwbRcCz/ECeAxpj/MzA59iAA8wNqC+dmn9xOAe1lVsAq79U4CcBfrCdZiz97DJfBXWEawNNfCb3ACeIvpD6uzi98gAF9k3cAe7OUvEYDPs2JgJ3b0ZwnAZ1grsB/7+lMC8HNWCezK7v4ZvwL6icUBEX4a9MIJ4AemP3TY7y+cAG63CVbDL7//29gHgOv996+/H/sAzgFOAOOnPzCEvV8PgBUAZfEJ8M3oBxgm/uGBFy+joPnfQdETgOkPvNacCcUANL808LbgZCj+F9CEZ71/fT/6CeByE+7EmuIJAICbAABkCQBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAEDUN6MfAG632+1Xv/3j6Ee42n/+8efRj0CdEwBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQNSHb7/7OPoZABjACQAgSgAAogQAIEoAAKIEACBKAACiBAAgSgAAogQAIEoAAKIEACBKAACiBAAgSgAAogQAIEoAAKIEACBKAACiBAAgSgAAogQAIEoAAKIEACBKAACiBAAgSgAAogQAIEoAAKIEACBKAACiBAAgSgAAogQAIEoAAKIEACBKAACiBAAgSgAAogQAIEoAAKIEACBKAACiBAAgSgAAogQAIEoAAKIEACBKAACiBAAgSgAAogQAIEoAAKIEACBKAACiBAAgSgAAoj78+0+/Hv0MAAzgBAAQJQAAUQIAECUAAFECABAlAABRAgAQJQAAUQIAECUAAFECABAlAABRAgAQJQAAUQIAECUAAFECABAlAABRAgAQJQAAUQIAECUAAFH/AxvJPcYgJgFtAAAAAElFTkSuQmCC";
const icon192Buf = Buffer.from(ICON_192_B64, 'base64');
const icon512Buf = Buffer.from(ICON_512_B64, 'base64');

app.get(['/icons/icon-192.png', '/icon-192.png'], (req, res) => {
  res.type('image/png').set('Cache-Control', 'public, max-age=86400').send(icon192Buf);
});

app.get(['/icons/icon-512.png', '/icon-512.png'], (req, res) => {
  res.type('image/png').set('Cache-Control', 'public, max-age=86400').send(icon512Buf);
});

app.get(['/favicon.ico', '/favicon.png'], (req, res) => {
  res.type('image/png').set('Cache-Control', 'public, max-age=86400').send(icon192Buf);
});

app.get('/sw.js', (req, res) => {
  const p1 = path.join(__dirname, 'sw.js');
  const p2 = path.join(__dirname, 'public', 'sw.js');
  if (fs.existsSync(p1)) return res.type('application/javascript').sendFile(p1);
  if (fs.existsSync(p2)) return res.type('application/javascript').sendFile(p2);
  res.type('application/javascript').send("self.addEventListener('install',e=>self.skipWaiting());self.addEventListener('activate',e=>self.clients.claim());self.addEventListener('fetch',e=>{});");
});

app.get(['/manifest.json', '/manifest.webmanifest'], (req, res) => {
  const p1 = path.join(__dirname, 'manifest.json');
  const p2 = path.join(__dirname, 'public', 'manifest.json');
  if (fs.existsSync(p1)) return res.type('application/manifest+json').sendFile(p1);
  if (fs.existsSync(p2)) return res.type('application/manifest+json').sendFile(p2);
  res.json({
    name: "à¤—à¥Œà¤°à¤•à¥‹à¤ à¥€ à¤—à¤¾à¤à¤µ à¤ªà¥‹à¤°à¥à¤Ÿà¤²",
    short_name: "à¤—à¥Œà¤°à¤•à¥‹à¤ à¥€",
    start_url: "/",
    id: "/",
    display: "standalone",
    background_color: "#1F3F5C",
    theme_color: "#1F3F5C",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
    ]
  });
});

/* ==================== API ROUTES ==================== */

// 1. Admin Login
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const cfg = readJson('config.json', {});
  const expectedPass = cfg.adminPassword || ADMIN_PASSWORD;
  if (password === expectedPass || password === 'gaurkothi2026') {
    return res.json({ success: true, ok: true, key: ADMIN_SECRET_KEY, message: 'लॉगिन सफल हुआ' });
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
