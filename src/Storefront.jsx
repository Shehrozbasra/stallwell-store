import React, { useState, useMemo, useEffect } from "react";
import { Plus, Minus, Trash2, ShoppingBag, ArrowLeft, Lock, CreditCard } from "lucide-react";
import { useProducts } from "./useProducts";

const currency = (n) => `$${Number(n).toFixed(2)}`;

export default function Storefront() {
  const { products, loading, updateProduct } = useProducts();
  const [cart, setCart] = useState({});
  const [view, setView] = useState("shop"); // shop | cart | checkout | success
  const [toast, setToast] = useState(null);

  // Stripe redirects back here with ?payment=success after a real payment completes.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      setCart({});
      setView("success");
      window.history.replaceState({}, "", "/");
    }
  }, []);

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

  return (
    <div style={styles.app}>
      <style>{globalCss}</style>
      <Header cartCount={cartCount} onCart={() => setView("cart")} onShop={() => setView("shop")} />

      <main style={styles.main}>
        {loading && view === "shop" && <LoadingState />}
        {!loading && view === "shop" && <Shop products={products} onAdd={addToCart} />}
        {view === "cart" && (
          <Cart items={cartItems} subtotal={subtotal} onQty={setCartQty} onBack={() => setView("shop")} onCheckout={() => setView("checkout")} />
        )}
        {view === "checkout" && (
          <Checkout items={cartItems} subtotal={subtotal} onBack={() => setView("cart")} />
        )}
        {view === "success" && <Success onShop={() => setView("shop")} />}
      </main>

      <Footer />
      {toast && <div style={styles.toast}>{toast}</div>}
    </div>
  );
}

function Header({ cartCount, onCart, onShop }) {
  return (
    <header style={styles.header}>
      <button style={styles.logo} onClick={onShop} aria-label="Go to shop">
        <span style={styles.logoMark}>S</span>
        <span style={styles.logoText}>Stallwell</span>
      </button>
      <button style={styles.cartBtn} onClick={onCart} aria-label="View cart">
        <ShoppingBag size={18} />
        {cartCount > 0 && <span style={styles.cartBadge}>{cartCount}</span>}
      </button>
    </header>
  );
}

function Footer() {
  return (
    <footer style={styles.footer}>
      <p style={styles.footerText}>© {new Date().getFullYear()} Stallwell</p>
      <a href="/seller" style={styles.sellerLink}>Seller sign in</a>
    </footer>
  );
}

function LoadingState() {
  return <div style={{ padding: "80px 0", textAlign: "center", color: "#a39d8c" }}>Loading the stall…</div>;
}

function Shop({ products, onAdd }) {
  return (
    <div style={{ animation: "fadeIn 0.35s ease" }}>
      <div style={styles.heroBlock}>
        <p style={styles.eyebrow}>the stall is open</p>
        <h1 style={styles.h1}>Small batch. No middleman.</h1>
        <p style={styles.heroSub}>Every item below is picked and packed by one person — me.</p>
      </div>

      {products.length === 0 ? (
        <EmptyState title="Nothing on the stall yet" body="Check back soon — new pieces are on the way." />
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
          <button style={{ ...styles.addBtn, ...(out ? styles.addBtnDisabled : {}) }} onClick={() => onAdd(product.id)} disabled={out}>
            {out ? "Sold out" : "Add"}
          </button>
        </div>
        <p style={styles.stockLine}>{out ? "—" : `${product.qty} left`}</p>
      </div>
    </div>
  );
}

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
                  {i.image ? <img src={i.image} alt={i.name} style={styles.cardImageImg} /> : <div style={styles.cardImagePlaceholder}>{i.name.charAt(0).toUpperCase()}</div>}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={styles.cartItemName}>{i.name}</p>
                  <p style={styles.cartItemPrice}>{currency(i.price)} each</p>
                </div>
                <div style={styles.qtyControl}>
                  <button style={styles.qtyBtn} onClick={() => onQty(i.id, i.qty - 1)} aria-label="Decrease quantity"><Minus size={14} /></button>
                  <span style={styles.qtyNum}>{i.qty}</span>
                  <button style={styles.qtyBtn} onClick={() => onQty(i.id, i.qty + 1)} aria-label="Increase quantity"><Plus size={14} /></button>
                </div>
                <p style={styles.lineTotal}>{currency(i.qty * i.price)}</p>
                <button style={styles.removeBtn} onClick={() => onQty(i.id, 0)} aria-label="Remove item"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
          <div style={styles.summaryBox}>
            <div style={styles.summaryRow}><span>Subtotal</span><span>{currency(subtotal)}</span></div>
            <p style={styles.summaryNote}>Shipping and any tax are calculated at checkout.</p>
            <button style={styles.primaryBtn} onClick={onCheckout}>Go to checkout</button>
          </div>
        </>
      )}
    </div>
  );
}

function Checkout({ items, subtotal, onBack }) {
  const [email, setEmail] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const shipping = items.length > 0 ? 4.5 : 0;
  const total = subtotal + shipping;

  async function handlePay() {
    if (!email) return;
    setProcessing(true);
    setError("");
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          items: items.map((i) => ({ name: i.name, price: i.price, qty: i.qty, image: i.image })),
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // Stripe's secure hosted checkout —
        // shows card, Apple Pay, and Google Pay automatically based on the
        // visitor's device and browser, with no extra code needed here.
      } else {
        setError(data.error || "Something went wrong starting checkout.");
        setProcessing(false);
      }
    } catch (err) {
      setError("Couldn't reach checkout. Please try again.");
      setProcessing(false);
    }
  }

  const canPay = email.includes("@") && !processing;

  return (
    <div style={{ animation: "fadeIn 0.3s ease", maxWidth: 640, margin: "0 auto" }}>
      <BackLink onClick={onBack} label="Back to bag" />
      <h1 style={styles.pageTitle}>Checkout</h1>
      <div style={styles.checkoutSection}>
        <label style={styles.label}>Email</label>
        <input style={styles.input} type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <p style={{ fontSize: 12, color: "#a39d8c", margin: "4px 0 0" }}>Shipping address is collected on the next step.</p>
      </div>
      <div style={styles.summaryBox}>
        <div style={styles.summaryRow}><span>Subtotal</span><span>{currency(subtotal)}</span></div>
        <div style={styles.summaryRow}><span>Shipping</span><span>{currency(shipping)}</span></div>
        <div style={{ ...styles.summaryRow, fontWeight: 700, borderTop: "1px solid #e7e2d8", paddingTop: 10, marginTop: 4 }}>
          <span>Total</span><span>{currency(total)}</span>
        </div>
      </div>
      <div style={styles.payBlock}>
        <button style={{ ...styles.primaryBtn, opacity: canPay ? 1 : 0.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} disabled={!canPay} onClick={handlePay}>
          <CreditCard size={16} />{processing ? "Redirecting to secure checkout…" : `Continue to payment`}
        </button>
        {error && <p style={{ color: "#c0392b", fontSize: 12, textAlign: "center" }}>{error}</p>}
        <p style={styles.secureNote}><Lock size={12} style={{ marginRight: 5, verticalAlign: -1 }} />Card, Apple Pay, and Google Pay handled securely by Stripe.</p>
      </div>
    </div>
  );
}

function Success({ onShop }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px", animation: "fadeIn 0.4s ease" }}>
      <div style={styles.successCheck}>✓</div>
      <h1 style={styles.pageTitle}>Order placed</h1>
      <p style={{ color: "#6b6458", marginBottom: 28 }}>Thanks for shopping the stall.</p>
      <button style={styles.primaryBtn} onClick={onShop}>Back to shop</button>
    </div>
  );
}

function BackLink({ onClick, label }) {
  return <button style={styles.backLink} onClick={onClick}><ArrowLeft size={15} style={{ marginRight: 6 }} /> {label}</button>;
}
function EmptyState({ title, body }) {
  return (
    <div style={styles.empty}>
      <p style={styles.emptyTitle}>{title}</p>
      <p style={styles.emptyBody}>{body}</p>
    </div>
  );
}

const globalCss = `
  * { box-sizing: border-box; }
  body { margin: 0; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  input:focus, button:focus-visible { outline: 2px solid #b5651d; outline-offset: 2px; }
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
`;

const styles = {
  app: { fontFamily: "'Iowan Old Style', 'Georgia', serif", background: "#faf7f0", minHeight: "100vh", color: "#1f1c16", display: "flex", flexDirection: "column" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #e7e2d8", background: "#faf7f0", position: "sticky", top: 0, zIndex: 10 },
  logo: { display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0 },
  logoMark: { width: 30, height: 30, borderRadius: "50%", background: "#b5651d", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15 },
  logoText: { fontSize: 19, fontWeight: 700, letterSpacing: "-0.01em" },
  cartBtn: { position: "relative", background: "none", border: "none", cursor: "pointer", padding: 8, color: "#1f1c16" },
  cartBadge: { position: "absolute", top: 0, right: 0, background: "#b5651d", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" },
  main: { maxWidth: 1080, margin: "0 auto", padding: "32px 20px 60px", flex: 1, width: "100%" },
  heroBlock: { padding: "20px 0 40px", borderBottom: "1px solid #e7e2d8", marginBottom: 36 },
  eyebrow: { fontFamily: "sans-serif", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#b5651d", fontWeight: 700, margin: "0 0 10px" },
  h1: { fontSize: "clamp(28px, 4vw, 42px)", margin: "0 0 10px", lineHeight: 1.1 },
  heroSub: { color: "#6b6458", fontSize: 16, margin: 0 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 22 },
  card: { background: "#fff", border: "1px solid #e7e2d8", borderRadius: 10, overflow: "hidden", display: "flex", flexDirection: "column" },
  cardImage: { position: "relative", aspectRatio: "1 / 1", background: "#f1ece1" },
  cardImageImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  cardImagePlaceholder: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, color: "#c9c0ad", fontWeight: 700 },
  outBadge: { position: "absolute", top: 8, left: 8, background: "#1f1c16", color: "#fff", fontSize: 10, fontFamily: "sans-serif", padding: "3px 8px", borderRadius: 12 },
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
  checkoutSection: { background: "#fff", border: "1px solid #e7e2d8", borderRadius: 10, padding: 18, marginBottom: 20, display: "flex", flexDirection: "column", gap: 4 },
  label: { display: "block", fontSize: 12, fontFamily: "sans-serif", fontWeight: 600, color: "#4a463c", margin: "10px 0 6px" },
  input: { width: "100%", fontFamily: "sans-serif", fontSize: 14, padding: "10px 12px", border: "1px solid #ddd6c4", borderRadius: 8, background: "#fdfcf9" },
  payBlock: { display: "flex", flexDirection: "column", gap: 10 },
  walletBtn: { width: "100%", fontFamily: "sans-serif", fontSize: 14, fontWeight: 700, color: "#fff", border: "none", borderRadius: 10, padding: "13px 20px", cursor: "pointer" },
  dividerRow: { display: "flex", alignItems: "center", gap: 10, margin: "4px 0" },
  dividerLine: { flex: 1, height: 1, background: "#e7e2d8" },
  dividerText: { fontSize: 11, color: "#a39d8c", fontFamily: "sans-serif" },
  secureNote: { fontSize: 11, color: "#a39d8c", textAlign: "center", fontFamily: "sans-serif", marginTop: 4 },
  successCheck: { width: 56, height: 56, borderRadius: "50%", background: "#2f6b3a", color: "#fff", fontSize: 26, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" },
  empty: { textAlign: "center", padding: "60px 20px", border: "1px dashed #ddd6c4", borderRadius: 10 },
  emptyTitle: { fontWeight: 700, fontSize: 16, margin: "0 0 6px" },
  emptyBody: { color: "#857d6e", fontSize: 14, margin: 0 },
  toast: { position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#1f1c16", color: "#faf7f0", fontFamily: "sans-serif", fontSize: 13, padding: "10px 18px", borderRadius: 30, boxShadow: "0 6px 20px rgba(0,0,0,0.2)" },
  footer: { borderTop: "1px solid #e7e2d8", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: 1080, margin: "0 auto", width: "100%" },
  footerText: { fontSize: 12, color: "#a39d8c", fontFamily: "sans-serif", margin: 0 },
  sellerLink: { fontSize: 12, color: "#a39d8c", fontFamily: "sans-serif", textDecoration: "none" },
};
