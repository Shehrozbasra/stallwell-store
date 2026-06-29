import React, { useState } from "react";
import { Plus, Minus, Trash2, Lock, Package, TrendingUp, Archive, AlertCircle, Eye, X } from "lucide-react";
import { useProducts } from "./useProducts";

const currency = (n) => `£${Number(n).toFixed(2)}`;

export default function SellerDashboard() {
  const [unlocked, setUnlocked] = useState(false);
  return unlocked ? <Dashboard /> : <SignIn onSuccess={() => setUnlocked(true)} />;
}

function SignIn({ onSuccess }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [shaking, setShaking] = useState(false);

  function submit(e) {
    e.preventDefault();
    const ownerPassword = import.meta.env.VITE_SELLER_PASSWORD;
    if (password === ownerPassword) {
      onSuccess();
    } else {
      setError(true);
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
  }

  return (
    <div style={d.signInPage}>
      <style>{dcss}</style>
      <a href="/" style={d.signInBack}>← View store</a>
      <div style={{ ...d.signInCard, animation: shaking ? "shake 0.5s ease" : "none" }}>
        <div style={d.signInLock}><Lock size={22} strokeWidth={1.5} /></div>
        <h1 style={d.signInTitle}>Stallwell</h1>
        <p style={d.signInRole}>Seller dashboard</p>
        <form onSubmit={submit} style={{ width: "100%" }}>
          <input
            style={{ ...d.signInInput, borderColor: error ? "#f87171" : "#2a3050" }}
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            autoFocus
          />
          {error && <p style={d.signInError}>Incorrect password. Try again.</p>}
          <button type="submit" style={d.signInBtn}>Sign in</button>
        </form>
      </div>
    </div>
  );
}

function Dashboard() {
  const { products, loading, addProduct, updateProduct, deleteProduct } = useProducts();
  const [form, setForm] = useState({ name: "", price: "", qty: "", details: "", image: "" });
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [panel, setPanel] = useState("stock"); // stock | add

  const totalStock = products.reduce((s, p) => s + p.qty, 0);
  const totalValue = products.reduce((s, p) => s + p.qty * p.price, 0);
  const outOfStock = products.filter((p) => p.qty <= 0);
  const lowStock = products.filter((p) => p.qty > 0 && p.qty <= 3);

  function resetForm() { setForm({ name: "", price: "", qty: "", details: "", image: "" }); setEditingId(null); }

  function handleImageUpload(e) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, image: reader.result }));
    reader.readAsDataURL(file);
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim() || form.price === "" || form.qty === "") return;
    setSaving(true);
    const payload = { name: form.name.trim(), price: parseFloat(form.price) || 0, qty: parseInt(form.qty, 10) || 0, details: form.details.trim(), image: form.image };
    try {
      if (editingId) await updateProduct(editingId, payload);
      else await addProduct(payload);
      resetForm(); setPanel("stock");
    } catch (err) { alert("Error saving: " + err.message); }
    setSaving(false);
  }

  function startEdit(p) {
    setForm({ name: p.name, price: String(p.price), qty: String(p.qty), details: p.details || "", image: p.image || "" });
    setEditingId(p.id); setPanel("add");
  }

  async function handleDelete(id) {
    if (!window.confirm("Remove this product?")) return;
    try { await deleteProduct(id); if (editingId === id) { resetForm(); setPanel("stock"); } }
    catch (err) { alert("Couldn't delete: " + err.message); }
  }

  async function adjustQty(id, current, delta) {
    try { await updateProduct(id, { qty: Math.max(0, current + delta) }); }
    catch (err) { alert("Couldn't update: " + err.message); }
  }

  return (
    <div style={d.dash}>
      <style>{dcss}</style>

      {/* SIDEBAR */}
      <aside style={d.sidebar}>
        <div style={d.sidebarTop}>
          <p style={d.sidebarBrand}>STALLWELL</p>
          <p style={d.sidebarRole}>Seller dashboard</p>
        </div>
        <nav style={d.sidebarNav}>
          <button style={{ ...d.sidebarNavBtn, ...(panel === "stock" ? d.sidebarNavBtnActive : {}) }} onClick={() => { setPanel("stock"); resetForm(); }}>
            <Package size={16} /> Stock
          </button>
          <button style={{ ...d.sidebarNavBtn, ...(panel === "add" ? d.sidebarNavBtnActive : {}) }} onClick={() => setPanel("add")}>
            <Plus size={16} /> {editingId ? "Edit product" : "Add product"}
          </button>
        </nav>
        <a href="/" style={d.viewStoreBtn} target="_blank" rel="noopener noreferrer">
          <Eye size={14} style={{ marginRight: 8 }} /> View live store
        </a>
      </aside>

      {/* MAIN */}
      <main style={d.main}>

        {/* STATS */}
        <div style={d.statsRow}>
          <StatCard icon={<Package size={18} />} label="Products" value={products.length} />
          <StatCard icon={<Archive size={18} />} label="Units in stock" value={totalStock} />
          <StatCard icon={<TrendingUp size={18} />} label="Stock value" value={currency(totalValue)} gold />
          <StatCard icon={<AlertCircle size={18} />} label="Out of stock" value={outOfStock.length} warn={outOfStock.length > 0} />
        </div>

        {/* ALERTS */}
        {(outOfStock.length > 0 || lowStock.length > 0) && (
          <div style={d.alertBox}>
            {outOfStock.length > 0 && <p style={d.alertText}><AlertCircle size={14} style={{ marginRight: 8, color: "#f87171" }} />{outOfStock.length} product{outOfStock.length > 1 ? "s" : ""} out of stock: {outOfStock.map(p => p.name).join(", ")}</p>}
            {lowStock.length > 0 && <p style={d.alertText}><AlertCircle size={14} style={{ marginRight: 8, color: "#fbbf24" }} />{lowStock.length} product{lowStock.length > 1 ? "s" : ""} running low: {lowStock.map(p => p.name).join(", ")}</p>}
          </div>
        )}

        {/* STOCK PANEL */}
        {panel === "stock" && (
          <div>
            <div style={d.panelHeader}>
              <h2 style={d.panelTitle}>Current stock</h2>
              <button style={d.addProductBtn} onClick={() => setPanel("add")}><Plus size={15} style={{ marginRight: 6 }} />Add product</button>
            </div>
            {loading ? <p style={{ color: "#6b7280" }}>Loading…</p>
              : products.length === 0 ? (
                <div style={d.emptyState}>
                  <Package size={40} strokeWidth={1} style={{ color: "#2a3050", marginBottom: 16 }} />
                  <p style={d.emptyTitle}>No products yet</p>
                  <p style={d.emptySub}>Add your first product to get started.</p>
                  <button style={d.addProductBtn} onClick={() => setPanel("add")}><Plus size={14} style={{ marginRight: 6 }} />Add product</button>
                </div>
              ) : (
                <div style={d.stockList}>
                  {products.map((p) => (
                    <div key={p.id} style={d.stockRow}>
                      <div style={d.stockImg}>
                        {p.image ? <img src={p.image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={d.stockInitial}>{p.name[0]}</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={d.stockName}>{p.name}</p>
                        <p style={d.stockPrice}>{currency(p.price)}</p>
                        {p.details && <p style={d.stockDetails}>{p.details}</p>}
                      </div>
                      <div style={d.stockQtyControl}>
                        <button style={d.stockQtyBtn} onClick={() => adjustQty(p.id, p.qty, -1)}><Minus size={12} /></button>
                        <span style={{ ...d.stockQtyNum, color: p.qty === 0 ? "#f87171" : p.qty <= 3 ? "#fbbf24" : "#f5f0e8" }}>{p.qty}</span>
                        <button style={d.stockQtyBtn} onClick={() => adjustQty(p.id, p.qty, 1)}><Plus size={12} /></button>
                      </div>
                      <button style={d.editBtn} onClick={() => startEdit(p)}>Edit</button>
                      <button style={d.deleteBtn} onClick={() => handleDelete(p.id)} aria-label="Delete"><Trash2 size={15} strokeWidth={1.5} /></button>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        )}

        {/* ADD/EDIT PANEL */}
        {panel === "add" && (
          <div>
            <div style={d.panelHeader}>
              <h2 style={d.panelTitle}>{editingId ? "Edit product" : "Add a product"}</h2>
              {editingId && <button style={d.cancelBtn} onClick={() => { resetForm(); setPanel("stock"); }}><X size={14} style={{ marginRight: 6 }} />Cancel edit</button>}
            </div>
            <form onSubmit={submit} style={d.form}>
              <div style={d.formGrid}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={d.label}>Product name</label>
                  <input style={d.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Hand-painted toy car" required />
                </div>
                <div>
                  <label style={d.label}>Price (£)</label>
                  <input style={d.input} type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00" required />
                </div>
                <div>
                  <label style={d.label}>Quantity in stock</label>
                  <input style={d.input} type="number" min="0" step="1" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} placeholder="0" required />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={d.label}>Details <span style={{ color: "#4a5568", fontWeight: 400 }}>(optional)</span></label>
                  <textarea style={{ ...d.input, minHeight: 80, resize: "vertical" }} value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} placeholder="Material, size, age range, care instructions…" />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={d.label}>Product photo <span style={{ color: "#4a5568", fontWeight: 400 }}>(optional)</span></label>
                  <input style={{ ...d.input, padding: "10px 14px" }} type="file" accept="image/*" onChange={handleImageUpload} />
                  {form.image && <img src={form.image} alt="preview" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 10, marginTop: 10 }} />}
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                <button type="submit" style={d.saveBtn} disabled={saving}>{saving ? "Saving…" : editingId ? "Save changes" : "Add to stall"}</button>
                <button type="button" style={d.cancelBtn} onClick={() => { resetForm(); setPanel("stock"); }}>Cancel</button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, gold: isGold, warn }) {
  return (
    <div style={{ ...d.statCard, ...(warn ? { borderColor: "#f8717133", background: "#f8717108" } : {}), ...(isGold ? { borderColor: "#c9a84c33" } : {}) }}>
      <div style={{ ...d.statIcon, color: warn ? "#f87171" : isGold ? "#c9a84c" : "#6b7280" }}>{icon}</div>
      <p style={{ ...d.statValue, color: isGold ? "#c9a84c" : warn && value > 0 ? "#f87171" : "#f5f0e8" }}>{value}</p>
      <p style={d.statLabel}>{label}</p>
    </div>
  );
}

const dkNavy = "#0a0f1e";
const dkMid = "#111827";
const dkCard = "#161d2e";
const dkBorder = "#1f2a42";
const dkMuted = "#6b7280";
const dkGold = "#c9a84c";
const dkPearl = "#f5f0e8";

const d = {
  signInPage: { fontFamily: "'Inter', system-ui, sans-serif", background: dkNavy, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" },
  signInBack: { position: "absolute", top: 24, left: 24, fontSize: 13, color: dkMuted, textDecoration: "none", fontFamily: "Inter, sans-serif" },
  signInCard: { background: dkCard, border: `1px solid ${dkBorder}`, borderRadius: 20, padding: "44px 40px", width: "100%", maxWidth: 380, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 },
  signInLock: { width: 50, height: 50, borderRadius: "50%", background: `${dkGold}18`, border: `1px solid ${dkGold}44`, display: "flex", alignItems: "center", justifyContent: "center", color: dkGold, marginBottom: 10 },
  signInTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26, color: dkPearl, margin: 0 },
  signInRole: { fontSize: 13, color: dkMuted, margin: "0 0 20px" },
  signInInput: { width: "100%", background: dkNavy, border: `1px solid ${dkBorder}`, color: dkPearl, fontFamily: "Inter, sans-serif", fontSize: 15, padding: "13px 16px", borderRadius: 10, marginBottom: 10, boxSizing: "border-box" },
  signInError: { fontSize: 12, color: "#f87171", margin: "0 0 12px", textAlign: "center", width: "100%" },
  signInBtn: { width: "100%", fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 700, background: dkGold, color: dkNavy, border: "none", borderRadius: 10, padding: "13px", cursor: "pointer" },

  dash: { fontFamily: "'Inter', system-ui, sans-serif", display: "flex", minHeight: "100vh", background: dkMid, color: dkPearl },
  sidebar: { width: 220, background: dkNavy, borderRight: `1px solid ${dkBorder}`, display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh" },
  sidebarTop: { padding: "28px 20px 20px", borderBottom: `1px solid ${dkBorder}` },
  sidebarBrand: { fontFamily: "'Playfair Display', serif", fontSize: 16, color: dkGold, letterSpacing: "0.12em", margin: "0 0 3px" },
  sidebarRole: { fontSize: 11, color: dkMuted, letterSpacing: "0.06em", margin: 0 },
  sidebarNav: { flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 4 },
  sidebarNavBtn: { display: "flex", alignItems: "center", gap: 10, width: "100%", fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 500, background: "transparent", border: "none", color: dkMuted, padding: "10px 12px", borderRadius: 8, cursor: "pointer", textAlign: "left" },
  sidebarNavBtnActive: { background: `${dkGold}18`, color: dkGold },
  viewStoreBtn: { display: "flex", alignItems: "center", fontSize: 12, color: dkMuted, textDecoration: "none", padding: "16px 20px", borderTop: `1px solid ${dkBorder}` },

  main: { flex: 1, padding: "36px 40px 60px", maxWidth: 900 },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 },
  statCard: { background: dkCard, border: `1px solid ${dkBorder}`, borderRadius: 14, padding: "20px 22px" },
  statIcon: { marginBottom: 10 },
  statValue: { fontSize: 26, fontWeight: 700, margin: "0 0 3px", fontFamily: "'Playfair Display', serif" },
  statLabel: { fontSize: 12, color: dkMuted, margin: 0 },

  alertBox: { background: `${dkCard}`, border: `1px solid ${dkBorder}`, borderRadius: 12, padding: "14px 18px", marginBottom: 24, display: "flex", flexDirection: "column", gap: 8 },
  alertText: { fontSize: 13, color: dkMuted, margin: 0, display: "flex", alignItems: "center" },

  panelHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  panelTitle: { fontFamily: "'Playfair Display', serif", fontSize: 24, margin: 0 },
  addProductBtn: { display: "flex", alignItems: "center", fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, background: dkGold, color: dkNavy, border: "none", borderRadius: 8, padding: "10px 18px", cursor: "pointer" },
  cancelBtn: { display: "flex", alignItems: "center", fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, background: "transparent", color: dkMuted, border: `1px solid ${dkBorder}`, borderRadius: 8, padding: "10px 18px", cursor: "pointer" },

  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px", background: dkCard, border: `1px solid ${dkBorder}`, borderRadius: 16, gap: 8 },
  emptyTitle: { fontFamily: "'Playfair Display', serif", fontSize: 20, margin: 0 },
  emptySub: { fontSize: 14, color: dkMuted, margin: "0 0 20px" },

  stockList: { display: "flex", flexDirection: "column", gap: 10 },
  stockRow: { display: "flex", alignItems: "center", gap: 14, background: dkCard, border: `1px solid ${dkBorder}`, borderRadius: 12, padding: "12px 16px" },
  stockImg: { width: 52, height: 52, borderRadius: 10, background: dkNavy, flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" },
  stockInitial: { fontFamily: "'Playfair Display', serif", fontSize: 22, color: dkBorder },
  stockName: { fontSize: 14, fontWeight: 600, margin: "0 0 2px", color: dkPearl },
  stockPrice: { fontSize: 13, color: dkGold, margin: "0 0 2px", fontFamily: "'Playfair Display', serif" },
  stockDetails: { fontSize: 12, color: dkMuted, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 300 },
  stockQtyControl: { display: "flex", alignItems: "center", gap: 10 },
  stockQtyBtn: { width: 28, height: 28, borderRadius: "50%", border: `1px solid ${dkBorder}`, background: "transparent", color: dkPearl, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  stockQtyNum: { minWidth: 28, textAlign: "center", fontSize: 15, fontWeight: 700, fontFamily: "'Playfair Display', serif" },
  editBtn: { fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, background: "transparent", color: dkMuted, border: `1px solid ${dkBorder}`, borderRadius: 8, padding: "7px 14px", cursor: "pointer" },
  deleteBtn: { background: "transparent", border: "none", color: dkMuted, cursor: "pointer", padding: 6 },

  form: { background: dkCard, border: `1px solid ${dkBorder}`, borderRadius: 16, padding: 28 },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 20px" },
  label: { display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: dkMuted, marginBottom: 8, marginTop: 16 },
  input: { width: "100%", background: dkNavy, border: `1px solid ${dkBorder}`, color: dkPearl, fontFamily: "Inter, sans-serif", fontSize: 14, padding: "12px 14px", borderRadius: 10, boxSizing: "border-box" },
  saveBtn: { fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700, background: dkGold, color: dkNavy, border: "none", borderRadius: 8, padding: "12px 24px", cursor: "pointer" },
};

const dcss = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0a0f1e; }
  input:focus, textarea:focus { outline: 2px solid #c9a84c; outline-offset: 2px; border-color: #c9a84c !important; }
  button:focus-visible { outline: 2px solid #c9a84c; outline-offset: 2px; }
  @keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }
`;
