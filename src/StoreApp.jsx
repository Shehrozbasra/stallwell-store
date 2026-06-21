import React, { useState, useEffect, useMemo } from "react";
import { Plus, Minus, Trash2, ShoppingBag, X, Package, ArrowLeft, Lock, CreditCard } from "lucide-react";

// ---------- Demo seed data (replace via Admin) ----------
const SEED_PRODUCTS = [
  { id: "p1", name: "Hand-painted Wooden Top", price: 8.5, qty: 14, details: "Spins for 40+ seconds. Ages 4+.", image: "" },
  { id: "p2", name: "Beaded Friendship Bracelet", price: 5, qty: 22, details: "Adjustable cord, one size fits most.", image: "" },
  { id: "p3", name: "Mini Puzzle Cube", price: 6.75, qty: 9, details: "3x3, smooth turning.", image: "" },
];

function loadProducts() {
  try {
    const raw = localStorage.getItem("stallwell_products");
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return SEED_PRODUCTS;
}
function saveProducts(products) {
  try { localStorage.setItem("stallwell_products", JSON.stringify(products)); } catch (e) {}
}

const currency = (n) => `$${Number(n).toFixed(2)}`;

export default function StoreApp() {
  const [products, setProducts] = useState(loadProducts());
  const [cart, setCart] = useState({}); // id -> qty
  const [view, setView] = useState("shop"); // shop | cart | checkout | admin | success
  const [toast, setToast] = useState(null);

  useEffect(() => { saveProducts(products); }, [products]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }

  function addToCart(id) {
    const product = products.find((p) => p.id === id);
    if (!product || product.qty < 1) return;
    setCart((c) => {
      const current = c[id] || 0;
      if (current >= product.qty) {
        showToast("That's all we have in stock");
        return c;
      }
      return { ...c, [id]: current + 1 };
    });
    showToast(`Added ${product.name}`);
  }

  function setCartQty(id, qty) {
    const product = products.find((p) => p.id === id);
    const max = product ? product.qty : 99;
    const clamped = Math.max(0, Math.min(qty, max));
    setCart((c) => {
      const next = { ...c };
      if (clamped <= 0) delete next[id];
      else next[id] = clamped;
      return next;
    });
  }

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => ({ ...products.find((p) => p.id === id), qty }))
        .filter((i) => i.id),
    [cart, products]
  );
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);
  const subtotal = cartItems.reduce((s, i) => s + i.qty * i.price, 0);

  function completeOrder() {
    // Deduct stock
    setProducts((prev) =>
      prev.map((p) => {
        const orderedQty = cart[p.id] || 0;
        return orderedQty ? { ...p, qty: Math.max(0, p.qty - orderedQty) } : p;
      })
    );
    setCart({});
    setView("success");
  }

  return (
    <div style={styles.app}>
      <style>{globalCss}</style>
      <Header
        cartCount={cartCount}
        onCart={() => setView("cart")}
        onShop={() => setView("shop")}
        onAdmin={() => setView("admin")}
        view={view}
      />

      <main style={styles.main}>
        {view === "shop" && <Shop products={products} onAdd={addToCart} />}
        {view === "cart" && (
          <Cart
            items={cartItems}
            subtotal={subtotal}
            onQty={setCartQty}
            onBack={() => setView("shop")}
            onCheckout={() => setView("checkout")}
          />
        )}
        {view === "checkout" && (
          <Checkout
            items={cartItems}
            subtotal={subtotal}
            onBack={() => setView("cart")}
            onComplete={completeOrder}
          />
        )}
        {view === "success" && <Success onShop={() => setView("shop")} />}
        {view === "admin" && (
          <Admin products={products} setProducts={setProducts} />
        )}
      </main>

      {toast && <div style={styles.toast}>{toast}</div>}
    </div>
  );
}

// ---------------- Header ----------------
function Header({ cartCount, onCart, onShop, onAdmin, view }) {
  return (
    <header style={styles.header}>
      <button style={styles.logo} onClick={onShop} aria-label="Go to shop">
        <span style={styles.logoMark}>S</span>
        <span style={styles.logoText}>Stallwell</span>
      </button>
      <nav style={styles.nav}>
        <button
          style={{ ...styles.navBtn, ...(view === "admin" ? styles.navBtnActive : {}) }}
          onClick={onAdmin}
        >
          <Package size={16} style={{ marginRight: 6 }} />
          Manage stock
        </button>
        <button style={styles.cartBtn} onClick={onCart} aria-label="View cart">
          <ShoppingBag size={18} />
          {cartCount > 0 && <span style={styles.cartBadge}>{cartCount}</span>}
        </button>
      </nav>
    </header>
  );
}

// ---------------- Shop ----------------
function Shop({ products, onAdd }) {
  return (
    <div style={{ animation: "fadeIn 0.35s ease" }}>
      <div style={styles.heroBlock}>
        <p style={styles.eyebrow}>the stall is open</p>
        <h1 style={styles.h1}>Small batch. No middleman.</h1>
        <p style={styles.heroSub}>Every item below is picked and packed by one person — me.</p>
      </div>

      {products.length === 0 ? (
        <EmptyState
          title="Nothing on the stall yet"
          body="Head to Manage stock to add your first item."
        />
      ) : (
        <div style={styles.grid}>
          {products.map((p) => (
            <ProductCard key={p.id} product={p} onAdd={onAdd} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, onAdd }) {
  const out = product.qty <= 0;
  return (
    <div style={styles.card}>
      <div style={styles.cardImage}>
        {product.image ? (
          <img src={product.image} alt={product.name} style={styles.cardImageImg} />
        ) : (
          <div style={styles.cardImagePlaceholder}>{product.name.charAt(0).toUpperCase()}</div>
        )}
        {out && <div style={styles.outBadge}>Out of stock</div>}
      </div>
      <div style={styles.cardBody}>
        <h3 style={styles.cardTitle}>{product.name}</h3>
        {product.details && <p style={styles.cardDetails}>{product.details}</p>}
        <div style={styles.cardFooter}>
          <span style={styles.cardPrice}>{currency(product.price)}</span>
          <button
            style={{ ...styles.addBtn, ...(out ? styles.addBtnDisabled : {}) }}
            onClick={() => onAdd(product.id)}
            disabled={out}
          >
            {out ? "Sold out" : "Add"}
          </button>
        </div>
        <p style={styles.stockLine}>{out ? "—" : `${product.qty} left`}</p>
      </div>
    </div>
  );
}

// ---------------- Cart ----------------
function Cart({ items, subtotal, onQty, onBack, onCheckout }) {
  return (
    <div style={{ animation: "fadeIn 0.3s ease", maxWidth: 640, margin: "0 auto" }}>
      <BackLink onClick={onBack} label="Continue shopping" />
      <h1 style={styles.pageTitle}>Your bag</h1>

      {items.length === 0 ? (
        <EmptyState title="Your bag is empty" body="Add something from the stall." />
      ) : (
        <>
          <div style={styles.cartList}>
            {items.map((i) => (
              <div key={i.id} style={styles.cartRow}>
                <div style={styles.cartRowImage}>
                  {i.image ? (
                    <img src={i.image} alt={i.name} style={styles.cardImageImg} />
                  ) : (
                    <div style={styles.cardImagePlaceholder}>{i.name.charAt(0).toUpperCase()}</div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={styles.cartItemName}>{i.name}</p>
                  <p style={styles.cartItemPrice}>{currency(i.price)} each</p>
                </div>
                <div style={styles.qtyControl}>
                  <button style={styles.qtyBtn} onClick={() => onQty(i.id, i.qty - 1)} aria-label="Decrease quantity">
                    <Minus size={14} />
                  </button>
                  <span style={styles.qtyNum}>{i.qty}</span>
                  <button style={styles.qtyBtn} onClick={() => onQty(i.id, i.qty + 1)} aria-label="Increase quantity">
                    <Plus size={14} />
                  </button>
                </div>
                <p style={styles.lineTotal}>{currency(i.qty * i.price)}</p>
                <button style={styles.removeBtn} onClick={() => onQty(i.id, 0)} aria-label="Remove item">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div style={styles.summaryBox}>
            <div style={styles.summaryRow}>
              <span>Subtotal</span>
              <span>{currency(subtotal)}</span>
            </div>
            <p style={styles.summaryNote}>Shipping and any tax are calculated at checkout.</p>
            <button style={styles.primaryBtn} onClick={onCheckout}>
              Go to checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ---------------- Checkout ----------------
function Checkout({ items, subtotal, onBack, onComplete }) {
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [processing, setProcessing] = useState(false);
  const shipping = items.length > 0 ? 4.5 : 0;
  const total = subtotal + shipping;

  function handlePay(method) {
    if (!email || !address) return;
    setProcessing(true);
    // NOTE: this simulates payment for demo purposes.
    // Real Stripe Checkout / Payment Request Button replaces this block — see setup notes.
    setTimeout(() => {
      setProcessing(false);
      onComplete();
    }, 1100);
  }

  const canPay = email.includes("@") && address.trim().length > 4 && !processing;

  return (
    <div style={{ animation: "fadeIn 0.3s ease", maxWidth: 640, margin: "0 auto" }}>
      <BackLink onClick={onBack} label="Back to bag" />
      <h1 style={styles.pageTitle}>Checkout</h1>

      <div style={styles.checkoutSection}>
        <label style={styles.label}>Email</label>
        <input
          style={styles.input}
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label style={styles.label}>Shipping address</label>
        <input
          style={styles.input}
          type="text"
          placeholder="Street, city, postcode"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>

      <div style={styles.summaryBox}>
        <div style={styles.summaryRow}><span>Subtotal</span><span>{currency(subtotal)}</span></div>
        <div style={styles.summaryRow}><span>Shipping</span><span>{currency(shipping)}</span></div>
        <div style={{ ...styles.summaryRow, fontWeight: 700, borderTop: "1px solid #e7e2d8", paddingTop: 10, marginTop: 4 }}>
          <span>Total</span><span>{currency(total)}</span>
        </div>
      </div>

      <div style={styles.payBlock}>
        <button
          style={{ ...styles.walletBtn, background: "#000", opacity: canPay ? 1 : 0.5 }}
          disabled={!canPay}
          onClick={() => handlePay("apple_pay")}
        >
           Pay
        </button>
        <button
          style={{ ...styles.walletBtn, background: "#fff", color: "#1a1a1a", border: "1px solid #ddd", opacity: canPay ? 1 : 0.5 }}
          disabled={!canPay}
          onClick={() => handlePay("google_pay")}
        >
          <GoogleGIcon /> Pay
        </button>
        <div style={styles.dividerRow}>
          <span style={styles.dividerLine} />
          <span style={styles.dividerText}>or pay by card</span>
          <span style={styles.dividerLine} />
        </div>
        <button
          style={{ ...styles.primaryBtn, opacity: canPay ? 1 : 0.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          disabled={!canPay}
          onClick={() => handlePay("card")}
        >
          <CreditCard size={16} />
          {processing ? "Processing…" : `Pay ${currency(total)}`}
        </button>
        <p style={styles.secureNote}>
          <Lock size={12} style={{ marginRight: 5, verticalAlign: -1 }} />
          Demo checkout — no real charge yet. See setup notes to connect Stripe.
        </p>
      </div>
    </div>
  );
}

function Success({ onShop }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px", animation: "fadeIn 0.4s ease" }}>
      <div style={styles.successCheck}>✓</div>
      <h1 style={styles.pageTitle}>Order placed</h1>
      <p style={{ color: "#6b6458", marginBottom: 28 }}>
        Thanks for shopping the stall. A confirmation would normally land in your inbox here.
      </p>
      <button style={styles.primaryBtn} onClick={onShop}>Back to shop</button>
    </div>
  );
}

// ---------------- Admin ----------------
function Admin({ products, setProducts }) {
  const [form, setForm] = useState({ name: "", price: "", qty: "", details: "", image: "" });
  const [editingId, setEditingId] = useState(null);

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

  function submit(e) {
    e.preventDefault();
    if (!form.name.trim() || form.price === "" || form.qty === "") return;
    const payload = {
      name: form.name.trim(),
      price: parseFloat(form.price) || 0,
      qty: parseInt(form.qty, 10) || 0,
      details: form.details.trim(),
      image: form.image,
    };
    if (editingId) {
      setProducts((prev) => prev.map((p) => (p.id === editingId ? { ...p, ...payload } : p)));
    } else {
      setProducts((prev) => [...prev, { id: `p${Date.now()}`, ...payload }]);
    }
    resetForm();
  }

  function editProduct(p) {
    setForm({ name: p.name, price: String(p.price), qty: String(p.qty), details: p.details || "", image: p.image || "" });
    setEditingId(p.id);
  }

  function deleteProduct(id) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    if (editingId === id) resetForm();
  }

  function adjustQty(id, delta) {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, qty: Math.max(0, p.qty + delta) } : p))
    );
  }

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <h1 style={styles.pageTitle}>Manage stock</h1>
      <p style={{ color: "#6b6458", marginTop: -8, marginBottom: 28 }}>
        Add, edit, or remove what's on the stall. Changes are saved on this device.
      </p>

      <form onSubmit={submit} style={styles.adminForm}>
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
            <label style={styles.label}>Details (optional — fits anything: size, material, age range…)</label>
            <textarea style={{ ...styles.input, minHeight: 64, resize: "vertical" }} value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} placeholder="Any notes a buyer should know" />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={styles.label}>Photo (optional)</label>
            <input style={styles.input} type="file" accept="image/*" onChange={handleImageUpload} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button type="submit" style={styles.primaryBtn}>{editingId ? "Save changes" : "Add product"}</button>
          {editingId && <button type="button" style={styles.secondaryBtn} onClick={resetForm}>Cancel</button>}
        </div>
      </form>

      <h2 style={styles.subheading}>Current stock ({products.length})</h2>
      {products.length === 0 ? (
        <EmptyState title="No products yet" body="Use the form above to add your first one." />
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
                <button style={styles.qtyBtn} onClick={() => adjustQty(p.id, -1)} aria-label="Decrease stock"><Minus size={14} /></button>
                <span style={styles.qtyNum}>{p.qty}</span>
                <button style={styles.qtyBtn} onClick={() => adjustQty(p.id, 1)} aria-label="Increase stock"><Plus size={14} /></button>
              </div>
              <button style={styles.editBtn} onClick={() => editProduct(p)}>Edit</button>
              <button style={styles.removeBtn} onClick={() => deleteProduct(p.id)} aria-label="Delete product"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------- Small shared bits ----------------
function BackLink({ onClick, label }) {
  return (
    <button style={styles.backLink} onClick={onClick}>
      <ArrowLeft size={15} style={{ marginRight: 6 }} /> {label}
    </button>
  );
}
function EmptyState({ title, body }) {
  return (
    <div style={styles.empty}>
      <p style={styles.emptyTitle}>{title}</p>
      <p style={styles.emptyBody}>{body}</p>
    </div>
  );
}
function GoogleGIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" style={{ marginRight: 6 }}>
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 009 18z" />
      <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 013.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 000 9c0 1.45.35 2.83.96 4.05l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 00.96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}

// ---------------- Styles ----------------
const globalCss = `
  * { box-sizing: border-box; }
  body { margin: 0; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  input:focus, textarea:focus, button:focus-visible { outline: 2px solid #b5651d; outline-offset: 2px; }
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
`;

const styles = {
  app: { fontFamily: "'Iowan Old Style', 'Georgia', serif", background: "#faf7f0", minHeight: "100vh", color: "#1f1c16" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #e7e2d8", background: "#faf7f0", position: "sticky", top: 0, zIndex: 10 },
  logo: { display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0 },
  logoMark: { width: 30, height: 30, borderRadius: "50%", background: "#b5651d", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15 },
  logoText: { fontSize: 19, fontWeight: 700, letterSpacing: "-0.01em", color: "#1f1c16" },
  nav: { display: "flex", alignItems: "center", gap: 10 },
  navBtn: { display: "flex", alignItems: "center", fontSize: 13, fontFamily: "inherit", background: "none", border: "1px solid #e7e2d8", borderRadius: 20, padding: "8px 14px", cursor: "pointer", color: "#4a463c" },
  navBtnActive: { background: "#1f1c16", color: "#faf7f0", borderColor: "#1f1c16" },
  cartBtn: { position: "relative", background: "none", border: "none", cursor: "pointer", padding: 8, color: "#1f1c16" },
  cartBadge: { position: "absolute", top: 0, right: 0, background: "#b5651d", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" },
  main: { maxWidth: 1080, margin: "0 auto", padding: "32px 20px 80px" },
  heroBlock: { padding: "20px 0 40px", borderBottom: "1px solid #e7e2d8", marginBottom: 36 },
  eyebrow: { fontFamily: "sans-serif", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#b5651d", fontWeight: 700, margin: "0 0 10px" },
  h1: { fontSize: "clamp(28px, 4vw, 42px)", margin: "0 0 10px", lineHeight: 1.1 },
  heroSub: { color: "#6b6458", fontSize: 16, margin: 0 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 22 },
  card: { background: "#fff", border: "1px solid #e7e2d8", borderRadius: 10, overflow: "hidden", display: "flex", flexDirection: "column" },
  cardImage: { position: "relative", aspectRatio: "1 / 1", background: "#f1ece1" },
  cardImageImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  cardImagePlaceholder: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, color: "#c9c0ad", fontWeight: 700 },
  outBadge: { position: "absolute", top: 8, left: 8, background: "#1f1c16", color: "#fff", fontSize: 10, fontFamily: "sans-serif", padding: "3px 8px", borderRadius: 12, letterSpacing: "0.04em" },
  cardBody: { padding: 14 },
  cardTitle: { fontSize: 16, margin: "0 0 4px", fontWeight: 700 },
  cardDetails: { fontSize: 13, color: "#857d6e", margin: "0 0 10px", lineHeight: 1.4 },
  cardFooter: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  cardPrice: { fontSize: 16, fontWeight: 700 },
  addBtn: { fontFamily: "sans-serif", fontSize: 13, fontWeight: 600, background: "#1f1c16", color: "#faf7f0", border: "none", borderRadius: 20, padding: "8px 16px", cursor: "pointer" },
  addBtnDisabled: { background: "#d8d2c2", color: "#a39d8c", cursor: "not-allowed" },
  stockLine: { fontSize: 11, color: "#a39d8c", margin: "8px 0 0", fontFamily: "sans-serif" },
  pageTitle: { fontSize: 28, margin: "4px 0 20px" },
  backLink: { display: "flex", alignItems: "center", fontFamily: "sans-serif", fontSize: 13, background: "none", border: "none", color: "#6b6458", cursor: "pointer", padding: 0, marginBottom: 14 },
  cartList: { display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 },
  cartRow: { display: "flex", alignItems: "center", gap: 12, paddingBottom: 14, borderBottom: "1px solid #e7e2d8" },
  cartRowImage: { width: 56, height: 56, borderRadius: 8, overflow: "hidden", background: "#f1ece1", flexShrink: 0 },
  cartItemName: { fontSize: 14, fontWeight: 700, margin: "0 0 3px" },
  cartItemPrice: { fontSize: 12, color: "#857d6e", margin: 0, fontFamily: "sans-serif" },
  qtyControl: { display: "flex", alignItems: "center", gap: 8, fontFamily: "sans-serif" },
  qtyBtn: { width: 26, height: 26, borderRadius: "50%", border: "1px solid #ddd6c4", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  qtyNum: { minWidth: 18, textAlign: "center", fontSize: 13 },
  lineTotal: { fontSize: 14, fontWeight: 700, minWidth: 56, textAlign: "right" },
  removeBtn: { background: "none", border: "none", color: "#a39d8c", cursor: "pointer", padding: 6 },
  summaryBox: { background: "#fff", border: "1px solid #e7e2d8", borderRadius: 10, padding: 18, marginBottom: 20 },
  summaryRow: { display: "flex", justifyContent: "space-between", fontSize: 14, padding: "4px 0", fontFamily: "sans-serif" },
  summaryNote: { fontSize: 11, color: "#a39d8c", fontFamily: "sans-serif", margin: "6px 0 14px" },
  primaryBtn: { width: "100%", fontFamily: "sans-serif", fontSize: 14, fontWeight: 700, background: "#1f1c16", color: "#faf7f0", border: "none", borderRadius: 10, padding: "13px 20px", cursor: "pointer" },
  secondaryBtn: { fontFamily: "sans-serif", fontSize: 14, fontWeight: 600, background: "#fff", color: "#1f1c16", border: "1px solid #ddd6c4", borderRadius: 10, padding: "13px 20px", cursor: "pointer" },
  checkoutSection: { background: "#fff", border: "1px solid #e7e2d8", borderRadius: 10, padding: 18, marginBottom: 20, display: "flex", flexDirection: "column", gap: 4 },
  label: { display: "block", fontSize: 12, fontFamily: "sans-serif", fontWeight: 600, color: "#4a463c", margin: "10px 0 6px" },
  input: { width: "100%", fontFamily: "sans-serif", fontSize: 14, padding: "10px 12px", border: "1px solid #ddd6c4", borderRadius: 8, background: "#fdfcf9" },
  payBlock: { display: "flex", flexDirection: "column", gap: 10 },
  walletBtn: { width: "100%", fontFamily: "sans-serif", fontSize: 14, fontWeight: 700, color: "#fff", border: "none", borderRadius: 10, padding: "13px 20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  dividerRow: { display: "flex", alignItems: "center", gap: 10, margin: "4px 0" },
  dividerLine: { flex: 1, height: 1, background: "#e7e2d8" },
  dividerText: { fontSize: 11, color: "#a39d8c", fontFamily: "sans-serif" },
  secureNote: { fontSize: 11, color: "#a39d8c", textAlign: "center", fontFamily: "sans-serif", marginTop: 4 },
  successCheck: { width: 56, height: 56, borderRadius: "50%", background: "#2f6b3a", color: "#fff", fontSize: 26, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" },
  adminForm: { background: "#fff", border: "1px solid #e7e2d8", borderRadius: 10, padding: 20, marginBottom: 32 },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" },
  subheading: { fontSize: 18, margin: "0 0 16px" },
  adminList: { display: "flex", flexDirection: "column", gap: 10 },
  adminRow: { display: "flex", alignItems: "center", gap: 12, background: "#fff", border: "1px solid #e7e2d8", borderRadius: 10, padding: 10 },
  editBtn: { fontFamily: "sans-serif", fontSize: 12, fontWeight: 600, background: "#fff", border: "1px solid #ddd6c4", borderRadius: 16, padding: "6px 12px", cursor: "pointer" },
  empty: { textAlign: "center", padding: "60px 20px", border: "1px dashed #ddd6c4", borderRadius: 10 },
  emptyTitle: { fontWeight: 700, fontSize: 16, margin: "0 0 6px" },
  emptyBody: { color: "#857d6e", fontSize: 14, margin: 0 },
  toast: { position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#1f1c16", color: "#faf7f0", fontFamily: "sans-serif", fontSize: 13, padding: "10px 18px", borderRadius: 30, boxShadow: "0 6px 20px rgba(0,0,0,0.2)" },
};
