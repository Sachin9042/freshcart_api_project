const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { PRODUCTS, CATEGORIES, BRANDS } = require('./data');

const app = express();
const PORT = process.env.PORT || 5000;
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json({ limit: '1mb' }));

function readDb() {
  if (!fs.existsSync(DB_FILE)) return { users: [], sessions: {}, addresses: {}, orders: [], stock: {} };
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}
function writeDb(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}
function verifyPassword(password, user) {
  const hash = crypto.scryptSync(password, user.salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(user.passwordHash, 'hex'));
}
function token() { return crypto.randomBytes(32).toString('hex'); }
function id(prefix) { return prefix + crypto.randomBytes(4).toString('hex').toUpperCase(); }
function seed() {
  const db = readDb();
  if (!db.users) db.users = [];
  if (!db.sessions) db.sessions = {};
  if (!db.addresses) db.addresses = {};
  if (!db.orders) db.orders = [];
  if (!db.stock) db.stock = {};
  for (const p of PRODUCTS) if (db.stock[p.id] === undefined) db.stock[p.id] = p.stock;
  writeDb(db);
}
seed();

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const t = header.startsWith('Bearer ') ? header.slice(7) : '';
  const db = readDb();
  const userId = db.sessions[t];
  if (!userId) return res.status(401).json({ success: false, message: 'Authentication required' });
  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(401).json({ success: false, message: 'Invalid session' });
  req.user = user;
  req.token = t;
  req.db = db;
  next();
}

app.get('/api/health', (req, res) => res.json({ success: true, service: 'FreshCart API', time: new Date().toISOString() }));
app.get('/api/categories', (req, res) => res.json({ success: true, categories: CATEGORIES }));
app.get('/api/brands', (req, res) => res.json({ success: true, brands: BRANDS }));

app.get('/api/products', (req, res) => {
  let list = PRODUCTS.map(p => ({ ...p, stock: readDb().stock[p.id] ?? p.stock }));
  const q = String(req.query.search || '').toLowerCase().trim();
  const cat = String(req.query.category || '').toLowerCase().trim();
  const brand = String(req.query.brand || '').toLowerCase().trim();
  const min = Number(req.query.minPrice || 0);
  const max = Number(req.query.maxPrice || Infinity);
  if (q) list = list.filter(p => `${p.name} ${p.brand} ${p.cat}`.toLowerCase().includes(q));
  if (cat) list = list.filter(p => p.cat.toLowerCase() === cat);
  if (brand) list = list.filter(p => p.brand.toLowerCase() === brand);
  list = list.filter(p => p.price >= min && p.price <= max);
  const sort = String(req.query.sort || '');
  if (sort === 'price-asc') list.sort((a,b) => a.price-b.price);
  if (sort === 'price-desc') list.sort((a,b) => b.price-a.price);
  if (sort === 'rating') list.sort((a,b) => b.rating-a.rating);
  res.json({ success: true, count: list.length, products: list });
});
app.get('/api/products/:id', (req, res) => {
  const p = PRODUCTS.find(x => x.id === Number(req.params.id));
  if (!p) return res.status(404).json({ success:false, message:'Product not found' });
  const db = readDb();
  res.json({ success:true, product:{ ...p, stock: db.stock[p.id] ?? p.stock } });
});

app.post('/api/auth/register', (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (name.length < 2 || !email.includes('@') || password.length < 6) return res.status(400).json({success:false,message:'Name, valid email and password of at least 6 characters are required'});
  const db = readDb();
  if (db.users.some(u => u.email === email)) return res.status(409).json({success:false,message:'Account already exists'});
  const { salt, hash } = hashPassword(password);
  const user = { id:id('USR_'), name, email, salt, passwordHash:hash, createdAt:new Date().toISOString() };
  db.users.push(user);
  const t = token(); db.sessions[t] = user.id;
  writeDb(db);
  res.status(201).json({success:true, token:t, user:{id:user.id,name:user.name,email:user.email}});
});
app.post('/api/auth/login', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const db = readDb();
  const user = db.users.find(u => u.email === email);
  if (!user || !verifyPassword(password, user)) return res.status(401).json({success:false,message:'Incorrect email or password'});
  const t = token(); db.sessions[t] = user.id; writeDb(db);
  res.json({success:true, token:t, user:{id:user.id,name:user.name,email:user.email}});
});
app.post('/api/auth/logout', auth, (req,res) => { delete req.db.sessions[req.token]; writeDb(req.db); res.json({success:true}); });
app.get('/api/me', auth, (req,res) => res.json({success:true,user:{id:req.user.id,name:req.user.name,email:req.user.email}}));
app.put('/api/me', auth, (req,res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  if (name.length < 2 || !email.includes('@')) return res.status(400).json({success:false,message:'Valid name and email required'});
  if (req.db.users.some(u => u.email === email && u.id !== req.user.id)) return res.status(409).json({success:false,message:'Email is already in use'});
  req.user.name=name; req.user.email=email; writeDb(req.db);
  res.json({success:true,user:{id:req.user.id,name,email}});
});

app.get('/api/addresses', auth, (req,res) => res.json({success:true,addresses:req.db.addresses[req.user.id] || []}));
app.post('/api/addresses', auth, (req,res) => {
  const a = sanitizeAddress(req.body);
  if (!a.first || !a.last || !/^\d{10}$/.test(a.phone) || !a.address || !a.city || !/^\d{6}$/.test(a.pin)) return res.status(400).json({success:false,message:'Please provide a complete valid address'});
  const arr = req.db.addresses[req.user.id] || [];
  a.id = id('ADDR_'); a.createdAt = new Date().toISOString();
  arr.push(a); req.db.addresses[req.user.id] = arr; writeDb(req.db);
  res.status(201).json({success:true,address:a,addresses:arr});
});
app.put('/api/addresses/:id', auth, (req,res) => {
  const arr = req.db.addresses[req.user.id] || [];
  const i = arr.findIndex(a=>a.id===req.params.id);
  if(i<0) return res.status(404).json({success:false,message:'Address not found'});
  const a=sanitizeAddress(req.body); a.id=arr[i].id; a.createdAt=arr[i].createdAt; arr[i]=a; req.db.addresses[req.user.id]=arr; writeDb(req.db);
  res.json({success:true,address:a,addresses:arr});
});
app.delete('/api/addresses/:id', auth, (req,res) => {
  const arr = req.db.addresses[req.user.id] || [];
  req.db.addresses[req.user.id] = arr.filter(a=>a.id!==req.params.id); writeDb(req.db);
  res.json({success:true,addresses:req.db.addresses[req.user.id]});
});
function sanitizeAddress(b){ return {first:String(b.first||'').trim(),last:String(b.last||'').trim(),phone:String(b.phone||'').trim(),address:String(b.address||'').trim(),city:String(b.city||'').trim(),pin:String(b.pin||'').trim(),note:String(b.note||'').trim()}; }

app.get('/api/orders', auth, (req,res) => res.json({success:true,orders:req.db.orders.filter(o=>o.userId===req.user.id)}));
app.get('/api/orders/:id', auth, (req,res) => {
  const o=req.db.orders.find(x=>x.id===req.params.id && x.userId===req.user.id);
  if(!o) return res.status(404).json({success:false,message:'Order not found'});
  res.json({success:true,order:o});
});
app.post('/api/orders', auth, (req,res) => {
  const items=Array.isArray(req.body.items)?req.body.items:[];
  if(!items.length) return res.status(400).json({success:false,message:'Cart is empty'});
  const db=req.db; const normalized=[]; let subtotal=0;
  for(const item of items){
    const p=PRODUCTS.find(x=>x.id===Number(item.id)); const qty=Math.floor(Number(item.qty));
    if(!p || qty<1) return res.status(400).json({success:false,message:'Invalid product or quantity'});
    const available=Number(db.stock[p.id] ?? p.stock);
    if(qty>available) return res.status(409).json({success:false,message:`Only ${available} units of ${p.name} are available`});
    normalized.push({id:p.id,qty}); subtotal += p.price*qty;
  }
  const discount=Number(req.body.discount||0); const delivery=Number(req.body.delivery||0); const total=Math.max(0,subtotal-discount+delivery);
  normalized.forEach(x=>{db.stock[x.id]-=x.qty;});
  const o={id:id('FC'),userId:req.user.id,date:new Date().toLocaleDateString('en-IN'),time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}),items:normalized,total,status:'Order Placed',slot:String(req.body.slot||''),payment:String(req.body.payment||''),address:sanitizeAddress(req.body.address||{}),history:[{status:'Order Placed',time:'Just now'},{status:'Order Confirmed',time:'Pending'},{status:'Packing',time:'Pending'},{status:'Out for Delivery',time:'Pending'},{status:'Delivered',time:'Pending'}],createdAt:new Date().toISOString()};
  db.orders.unshift(o); writeDb(db); res.status(201).json({success:true,order:o,stock:db.stock});
});

app.get('/api/admin/products', (req,res)=>{ const db=readDb(); res.json({success:true,products:PRODUCTS.map(p=>({...p,stock:db.stock[p.id]??p.stock}))}); });
app.patch('/api/admin/products/:id/stock', (req,res)=>{ const pid=Number(req.params.id); if(!PRODUCTS.some(p=>p.id===pid)) return res.status(404).json({success:false,message:'Product not found'}); const s=Math.max(0,Math.floor(Number(req.body.stock))); if(!Number.isFinite(s)) return res.status(400).json({success:false,message:'Invalid stock'}); const db=readDb(); db.stock[pid]=s; writeDb(db); res.json({success:true,product:{...PRODUCTS.find(p=>p.id===pid),stock:s}}); });

app.use(express.static(path.join(__dirname, '..', 'public')));
app.get('*', (req,res)=>res.sendFile(path.join(__dirname,'..','public','index.html')));
app.listen(PORT,()=>console.log(`FreshCart running at http://localhost:${PORT}`));
