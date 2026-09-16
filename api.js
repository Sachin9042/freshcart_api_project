/* FreshCart API integration. The UI keeps a local fallback, but when this project is
   started with Node, accounts, addresses, orders and inventory use the REST API. */
const API_BASE = (location.protocol === 'file:') ? 'http://localhost:5000/api' : '/api';
const API_TOKEN_KEY = 'fc4_api_token';
let API_ONLINE = false;
async function apiFetch(path, options={}) {
  const headers = {'Content-Type':'application/json', ...(options.headers||{})};
  const t = localStorage.getItem(API_TOKEN_KEY);
  if (t) headers.Authorization = `Bearer ${t}`;
  const r = await fetch(API_BASE + path, {...options, headers});
  let data={}; try { data=await r.json(); } catch {}
  if(!r.ok) throw new Error(data.message || `API error ${r.status}`);
  return data;
}
async function apiHealth(){ try { await apiFetch('/health'); API_ONLINE=true; return true; } catch { API_ONLINE=false; return false; } }
async function apiSync(){
  if(!(await apiHealth())) return;
  try {
    const p=await apiFetch('/products');
    if(Array.isArray(p.products)){
      PRODUCTS.splice(0, PRODUCTS.length, ...p.products);
      p.products.forEach(x=>stock[x.id]=x.stock);
      save();
    }
  } catch {}
  const t=localStorage.getItem(API_TOKEN_KEY);
  if(t){
    try {
      const [me,ad,os]=await Promise.all([apiFetch('/me'),apiFetch('/addresses'),apiFetch('/orders')]);
      user=me.user; addresses=ad.addresses||[]; orders=os.orders||[]; save();
    } catch { localStorage.removeItem(API_TOKEN_KEY); }
  }
  render();
}
async function apiLogin(email,password){ const d=await apiFetch('/auth/login',{method:'POST',body:JSON.stringify({email,password})}); localStorage.setItem(API_TOKEN_KEY,d.token); return d; }
async function apiSignup(name,email,password){ const d=await apiFetch('/auth/register',{method:'POST',body:JSON.stringify({name,email,password})}); localStorage.setItem(API_TOKEN_KEY,d.token); return d; }
async function apiLogout(){ if(!API_ONLINE)return; try{await apiFetch('/auth/logout',{method:'POST'});}catch{} localStorage.removeItem(API_TOKEN_KEY); }
