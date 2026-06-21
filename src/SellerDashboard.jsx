import React, { useState } from "react";
import { Plus, Minus, Trash2, Lock, ArrowLeft } from "lucide-react";
import { useProducts } from "./useProducts";

const currency = (n) => `$${Number(n).toFixed(2)}`;

export default function SellerDashboard() {
  const [unlocked, setUnlocked] = useState(false);
  return unlocked ? <Dashboard /> : <SignIn onSuccess={() => setUnlocked(true)} />;
}

function SignIn({ onSuccess }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  function submit(e) {
    e.preventDefault();
    // Owner password is set via environment variable at deploy time —
    // never visible in the page source customers can view.
    const ownerPassword = import.meta.env.VITE_SELLER_PASSWORD;
    if (password === ownerPassword) {
      onSuccess();
    } else {
      setError(true);
    }
  }

  return (
    <div style={styles.signInWrap}>
      <style>{globalCss}</style>
      <a href="/" style={styles.backLink}><ArrowLeft size={15} style={{ marginRight: 6 }} /> Back to store</a>
      <div style={styles.signInCard}>
        <div style={styles.lockIcon}><Lock size={20} /></div>
        <h1 style={styles.signInTitle}>Seller sign in</h1>
        <p style={styles.signInSub}>Enter your owner password to manage the stall.</p>
        <form onSubmit={submit}>
          <input
            style={{ ...styles.input, borderColor: error ? "#c0392b" : "#ddd6c4" }}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            autoFocus
          />
          {error && <p style={styles.errorText}>That password isn't right. Try again.</p>}
          <button type="submit" style={styles.primaryBtn}>Sign in</button>
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

  const totalStock = products.reduce((s, p) => s + p.qty, 0);
  const totalValue = products.reduce((s, p) => s + p.qty * p.price, 0);
  const outOfStockCount = products.filter((p) => p.qty <= 0).length;

  function resetForm() {
    setForm({ name: "", price: "", qty: "", details: "", image: "" });
    setEditingId(null);
  }

  function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, image: reader.result }));
    reader.readAsDataURL(file);
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim() || form.price === "" || form.qty === "") return;
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      price: parseFloat(form.price) || 0,
      qty: parseInt(form.qty, 10) || 0,
      details: form.details.trim(),
      image: form.image,
    };
    try {
      if (editingId) await updateProduct(editingId, payload);
      else await addProduct(payload);
      resetForm();
    } catch (err) {
      alert("Something went wrong saving that product: " + err.message);
    }
    setSaving(false);
  }

  function editProduct(p) {
    setForm({ name: p.name, price: String(p.price), qty: String(p.qty), details: p.details || "", image: p.image || "" });
    setEditingId(p.id);
  }

  async function handleDelete(id) {
    if (!window.confirm("Remove this product from the stall?")) return;
    try {
      await deleteProduct(id);
      if (editingId === id) resetForm();
    } catch (err) {
      alert("Couldn't delete: " + err.message);
    }
  }

  async function adjustQty(id, current, delta) {
    try {
      await updateProduct(id, { qty: Math.max(0, current + delta) });
    } catch (err) {
      alert("Couldn't update stock: " + err.message);
    }
  }

  return (
    <div style={styles.dashWrap}>
      <style>{globalCss}</style>
      <header style={styles.dashHeader}>
        <div>
          <p style={styles.eyebrow}>seller dashboard</p>
          <h1 style={styles.dashTitle}>Stallwell</h1>
        </div>
        <a href="/" style={styles.viewStoreLink}>View live store →</a>
      </header>

      <div style={styles.statsRow}>
        <StatCard label="Products listed" value={products.length} />
        <StatCard label="Units in stock" value={totalStock} />
        <StatCard label="Stock value" value={currency(totalValue)} />
        <StatCard label="Out of stock" value={outOfStockCount} warn={outOfStockCount > 0} />
      </div>

      <form onSubmit={submit} style={styles.adminForm}>
        <h2 style={styles.subheading}>{editingId ? "Edit product" : "Add a product"}</h2>
        <div style={styles.formGrid}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={styles.label}>Product name</label>
            <input style={styles.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Beaded bracelet" />
          </div>
          <div>
            <label style={styles.label}>Price ($)</label>
            <input style={styles.input} type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
          </div>
          <div>
            <label style={styles.label}>Quantity in stock</label>
            <input style={styles.input} type="number" min="0" step="1" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} placeholder="0" />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={styles.label}>Details (optional)</label>
            <textarea style={{ ...styles.input, minHeight: 64, resize: "vertical" }} value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} placeholder="Any notes a buyer should know" />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={styles.label}>Photo (optional)</label>
            <input style={styles.input} type="file" accept="image/*" onChange={handleImageUpload} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button type="submit" style={styles.primaryBtnSmall} disabled={saving}>
            {saving ? "Saving…" : editingId ? "Save changes" : "Add product"}
          </button>
          {editingId && <button type="button" style={styles.secondaryBtn} onClick={resetForm}>Cancel</button>}
        </div>
      </form>

      <h2 style={styles.subheading}>Current stock ({products.length})</h2>
      {loading ? (
        <p style={{ color: "#a39d8c" }}>Loading…</p>
      ) : products.length === 0 ? (
        <div style={styles.empty}>
          <p style={styles.emptyTitle}>No products yet</p>
          <p style={styles.emptyBody}>Use the form above to add your first one.</p>
        </div>
      ) : (
        <div style={styles.adminList}>
          {products.map((p) => (
            <div key={p.id} style={styles.adminRow}>
              <div style={styles.cartRowImage}>
                {p.image ? <img src={p.image} alt={p.name} style={styles.cardImageImg} /> : <div style={styles.cardImagePlaceholder}>{p.name.charAt(0).toUpperCase()}</div>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={styles.cartItemName}>{p.name}</p>
                <p style={styles.cartItemPrice}>{currency(p.price)}</p>
              </div>
              <div style={styles.qtyControl}>
                <button style={styles.qtyBtn} onClick={() => adjustQty(p.id, p.qty, -1)} aria-label="Decrease stock"><Minus size={14} /></button>
                <span style={styles.qtyNum}>{p.qty}</span>
                <button style={styles.qtyBtn} onClick={() => adjustQty(p.id, p.qty, 1)} aria-label="Increase stock"><Plus size={14} /></button>
              </div>
              <button style={styles.editBtn} onClick={() => editProduct(p)}>Edit</button>
              <button style={styles.removeBtn} onClick={() => handleDelete(p.id)} aria-label="Delete product"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, warn }) {
  return (
    <div style={{ ...styles.statCard, ...(warn ? { borderColor: "#c0392b22", background: "#fdf3f1" } : {}) }}>
      <p style={styles.statValue}>{value}</p>
      <p style={styles.statLabel}>{label}</p>
    </div>
  );
}

const globalCss = `
  * { box-sizing: border-box; }
  body { margin: 0; }
  input:focus, textarea:focus, button:focus-visible { outline: 2px solid #b5651d; outline-offset: 2px; }
`;

const styles = {
  signInWrap: { fontFamily: "sans-serif", background: "#1f1c16", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 },
  backLink: { position: "absolute", top: 24, left: 24, display: "flex", alignItems: "center", color: "#a39d8c", textDecoration: "none", fontSize: 13 },
  signInCard: { background: "#faf7f0", borderRadius: 14, padding: "36px 32px", width: "100%", maxWidth: 360, textAlign: "center" },
  lockIcon: { width: 44, height: 44, borderRadius: "50%", background: "#1f1c16", color: "#faf7f0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" },
  signInTitle: { fontSize: 20, margin: "0 0 6px", color: "#1f1c16", fontFamily: "Georgia, serif" },
  signInSub: { fontSize: 13, color: "#857d6e", margin: "0 0 22px" },
  errorText: { color: "#c0392b", fontSize: 12, margin: "8px 0 0", textAlign: "left" },
  input: { width: "100%", fontFamily: "inherit", fontSize: 14, padding: "11px 12px", border: "1px solid #ddd6c4", borderRadius: 8, background: "#fff", marginBottom: 14 },
  primaryBtn: { width: "100%", fontFamily: "inherit", fontSize: 14, fontWeight: 700, background: "#1f1c16", color: "#faf7f0", border: "none", borderRadius: 8, padding: "12px 20px", cursor: "pointer" },
  primaryBtnSmall: { fontFamily: "inherit", fontSize: 13, fontWeight: 700, background: "#1f1c16", color: "#faf7f0", border: "none", borderRadius: 8, padding: "11px 18px", cursor: "pointer" },
  secondaryBtn: { fontFamily: "inherit", fontSize: 13, fontWeight: 600, background: "#fff", color: "#1f1c16", border: "1px solid #ddd6c4", borderRadius: 8, padding: "11px 18px", cursor: "pointer" },
  dashWrap: { fontFamily: "sans-serif", background: "#f4f1ea", minHeight: "100vh", padding: "24px 20px 60px" },
  dashHeader: { maxWidth: 920, margin: "0 auto 24px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  eyebrow: { fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#b5651d", fontWeight: 700, margin: "0 0 4px" },
  dashTitle: { fontSize: 24, margin: 0, color: "#1f1c16", fontFamily: "Georgia, serif" },
  viewStoreLink: { fontSize: 13, color: "#4a463c", textDecoration: "none" },
  statsRow: { maxWidth: 920, margin: "0 auto 28px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 },
  statCard: { background: "#fff", border: "1px solid #e7e2d8", borderRadius: 10, padding: "16px 18px" },
  statValue: { fontSize: 24, fontWeight: 700, margin: "0 0 2px", color: "#1f1c16" },
  statLabel: { fontSize: 12, color: "#857d6e", margin: 0 },
  adminForm: { maxWidth: 920, margin: "0 auto 28px", background: "#fff", border: "1px solid #e7e2d8", borderRadius: 10, padding: 20 },
  subheading: { fontSize: 16, margin: "0 0 16px", color: "#1f1c16" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" },
  label: { display: "block", fontSize: 12, fontWeight: 600, color: "#4a463c", margin: "10px 0 6px" },
  adminList: { maxWidth: 920, margin: "0 auto", display: "flex", flexDirection: "column", gap: 10 },
  adminRow: { display: "flex", alignItems: "center", gap: 12, background: "#fff", border: "1px solid #e7e2d8", borderRadius: 10, padding: 10 },
  cartRowImage: { width: 52, height: 52, borderRadius: 8, overflow: "hidden", background: "#f1ece1", flexShrink: 0 },
  cardImageImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  cardImagePlaceholder: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: "#c9c0ad", fontWeight: 700 },
  cartItemName: { fontSize: 14, fontWeight: 700, margin: "0 0 3px", color: "#1f1c16" },
  cartItemPrice: { fontSize: 12, color: "#857d6e", margin: 0 },
  qtyControl: { display: "flex", alignItems: "center", gap: 8 },
  qtyBtn: { width: 26, height: 26, borderRadius: "50%", border: "1px solid #ddd6c4", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  qtyNum: { minWidth: 18, textAlign: "center", fontSize: 13 },
  editBtn: { fontSize: 12, fontWeight: 600, background: "#fff", border: "1px solid #ddd6c4", borderRadius: 16, padding: "6px 12px", cursor: "pointer" },
  removeBtn: { background: "none", border: "none", color: "#a39d8c", cursor: "pointer", padding: 6 },
  empty: { maxWidth: 920, margin: "0 auto", textAlign: "center", padding: "60px 20px", border: "1px dashed #ddd6c4", borderRadius: 10 },
  emptyTitle: { fontWeight: 700, fontSize: 15, margin: "0 0 6px", color: "#1f1c16" },
  emptyBody: { color: "#857d6e", fontSize: 13, margin: 0 },
};
