import React, { useState, useMemo, useEffect, useRef } from "react";
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight, Lock, ChevronDown } from "lucide-react";
import { useProducts } from "./useProducts";

const currency = (n) => `£${Number(n).toFixed(2)}`;

export default function Storefront() {
  const { products, loading } = useProducts();
  const [cart, setCart] = useState({});
  const [cartOpen, setCartOpen] = useState(false);
  const [view, setView] = useState("shop");
  const [toast, setToast] = useState(null);
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      setCart({});
      setView("success");
      window.history.replaceState({}, "", "/");
    }
    setTimeout(() => setHeroVisible(true), 80);
  }, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }

  function addToCart(id) {
    const product = products.find((p) => p.id === id);
    if (!product || product.qty < 1) return;
    setCart((c) => {
      const current = c[id] || 0;
      if (current >= product.qty) { showToast("That's all we have"); return c; }
      return { ...c, [id]: current + 1 };
    });
    showToast(`Added to bag`);
    setTimeout(() => setCartOpen(true), 300);
  }

  function setCartQty(id, qty) {
    const product = products.find((p) => p.id === id);
    const max = product ? product.qty : 99;
    const clamped = Math.max(0, Math.min(qty, max));
    setCart((c) => { const next = { ...c }; if (clamped <= 0) delete next[id]; else next[id] = clamped; return next; });
  }

  const cartItems = useMemo(
    () => Object.entries(cart).map(([id, qty]) => ({ ...products.find((p) => p.id === id), qty })).filter((i) => i.id),
    [cart, products]
  );
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);
  const subtotal = cartItems.reduce((s, i) => s + i.qty * i.price, 0);

  if (view === "checkout") return <Checkout items={cartItems} subtotal={subtotal} onBack={() => setView("shop")} />;
  if (view === "success") return <Success onShop={() => setView("shop")} />;

  return (
    <div style={s.app}>
      <style>{css}</style>

      {/* NAV */}
      <nav style={s.nav}>
        <div style={s.navInner}>
          <a href="/" style={s.wordmark}>STALLWELL</a>
          <button style={s.bagBtn} onClick={() => setCartOpen(true)} aria-label="Open bag">
            <ShoppingBag size={20} strokeWidth={1.5} />
            {cartCount > 0 && <span style={s.bagCount}>{cartCount}</span>}
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section style={s.hero}>
        <div style={{ ...s.heroContent, opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(28px)", transition: "opacity 0.9s ease, transform 0.9s ease" }}>
          <p style={s.heroEyebrow}>Curated by one hand</p>
          <h1 style={s.heroH1}>Things worth<br /><em style={s.heroEm}>owning.</em></h1>
          <p style={s.heroSub}>Every piece is sourced, chosen, and shipped personally.<br />No warehouse. No bulk. Just good things.</p>
          <button style={s.heroCta} onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })}>
            Shop the collection <ChevronDown size={16} style={{ marginLeft: 8 }} />
          </button>
        </div>
        <div style={s.heroAccent} aria-hidden="true" />
      </section>

      {/* PRODUCTS */}
      <section id="products" style={s.productsSection}>
        <div style={s.productsHeader}>
          <p style={s.sectionEyebrow}>The collection</p>
          <h2 style={s.sectionTitle}>What's on the stall</h2>
        </div>
        {loading ? (
          <div style={s.loadingRow}>
            {[1,2,3].map(i => <div key={i} style={s.skeleton} className="skeleton" />)}
          </div>
        ) : products.length === 0 ? (
          <div style={s.emptyState}>
            <p style={s.emptyTitle}>New pieces arriving soon</p>
            <p style={s.emptySub}>Check back shortly — the stall is being stocked.</p>
          </div>
        ) : (
          <div style={s.grid}>
            {products.map((p) => <ProductCard key={p.id} product={p} onAdd={addToCart} />)}
          </div>
        )}
      </section>

      {/* TRUST BAR */}
      <section style={s.trustBar}>
        {["Free returns within 14 days", "Packed with care, every order", "Secure checkout via Stripe", "Ships across the UK"].map((t) => (
          <div key={t} style={s.trustItem}>
            <span style={s.trustDot} />
            <span style={s.trustText}>{t}</span>
          </div>
        ))}
      </section>

      {/* FOOTER */}
      <footer style={s.footer}>
        <p style={s.footerBrand}>STALLWELL</p>
        <p style={s.footerSub}>Made with care. Sold with honesty.</p>
        <a href="/seller" style={s.sellerLink}>Seller</a>
      </footer>

      {/* CART DRAWER */}
      {cartOpen && <div style={s.overlay} onClick={() => setCartOpen(false)} />}
      <div style={{ ...s.drawer, transform: cartOpen ? "translateX(0)" : "translateX(100%)" }}>
        <div style={s.drawerHeader}>
          <span style={s.drawerTitle}>Your bag {cartCount > 0 && <span style={s.drawerCount}>({cartCount})</span>}</span>
          <button style={s.drawerClose} onClick={() => setCartOpen(false)} aria-label="Close bag"><X size={20} strokeWidth={1.5} /></button>
        </div>
        {cartItems.length === 0 ? (
          <div style={s.drawerEmpty}>
            <ShoppingBag size={40} strokeWidth={1} style={{ color: "#3a3f52", marginBottom: 16 }} />
            <p style={s.drawerEmptyTitle}>Your bag is empty</p>
            <p style={s.drawerEmptySub}>Add something from the collection.</p>
            <button style={s.drawerShopBtn} onClick={() => setCartOpen(false)}>Continue shopping</button>
          </div>
        ) : (
          <>
            <div style={s.drawerItems}>
              {cartItems.map((i) => (
                <div key={i.id} style={s.drawerItem}>
                  <div style={s.drawerItemImg}>
                    {i.image ? <img src={i.image} alt={i.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={s.drawerItemInitial}>{i.name[0]}</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={s.drawerItemName}>{i.name}</p>
                    <p style={s.drawerItemPrice}>{currency(i.price)}</p>
                    <div style={s.qtyRow}>
                      <button style={s.qtyBtn} onClick={() => setCartQty(i.id, i.qty - 1)}><Minus size={12} /></button>
                      <span style={s.qtyNum}>{i.qty}</span>
                      <button style={s.qtyBtn} onClick={() => setCartQty(i.id, i.qty + 1)}><Plus size={12} /></button>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
                    <span style={s.drawerLineTotal}>{currency(i.qty * i.price)}</span>
                    <button style={s.drawerRemove} onClick={() => setCartQty(i.id, 0)} aria-label="Remove"><Trash2 size={14} strokeWidth={1.5} /></button>
                  </div>
                </div>
              ))}
            </div>
            <div style={s.drawerFooter}>
              <div style={s.drawerSubtotalRow}>
                <span style={s.drawerSubtotalLabel}>Subtotal</span>
                <span style={s.drawerSubtotalValue}>{currency(subtotal)}</span>
              </div>
              <p style={s.drawerNote}>Shipping calculated at checkout</p>
              <button style={s.checkoutBtn} onClick={() => { setCartOpen(false); setView("checkout"); }}>
                Checkout <ArrowRight size={16} style={{ marginLeft: 8 }} />
              </button>
            </div>
          </>
        )}
      </div>

      {toast && <div style={s.toast} className="toast-in">{toast}</div>}
    </div>
  );
}

function ProductCard({ product, onAdd }) {
  const out = product.qty <= 0;
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{ ...s.card, ...(hovered ? s.cardHovered : {}) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={s.cardImgWrap}>
        {product.image
          ? <img src={product.image} alt={product.name} style={s.cardImg} />
          : <div style={s.cardImgPlaceholder}><span style={s.cardImgInitial}>{product.name[0]}</span></div>
        }
        {out && <div style={s.soldOutBadge}>Sold out</div>}
        {!out && product.qty <= 3 && <div style={s.lowStockBadge}>Only {product.qty} left</div>}
      </div>
      <div style={s.cardBody}>
        <h3 style={s.cardName}>{product.name}</h3>
        {product.details && <p style={s.cardDetails}>{product.details}</p>}
        <div style={s.cardFooter}>
          <span style={s.cardPrice}>{currency(product.price)}</span>
          <button
            style={{ ...s.addBtn, ...(out ? s.addBtnOut : hovered && !out ? s.addBtnHovered : {}) }}
            onClick={() => onAdd(product.id)}
            disabled={out}
          >
            {out ? "Sold out" : "Add to bag"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Checkout({ items, subtotal, onBack }) {
  const [email, setEmail] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const shipping = 4.5;
  const total = subtotal + shipping;

  async function handlePay() {
    if (!email.includes("@")) return;
    setProcessing(true);
    setError("");
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, items: items.map((i) => ({ name: i.name, price: i.price, qty: i.qty, image: i.image })) }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else { setError(data.error || "Something went wrong. Please try again."); setProcessing(false); }
    } catch {
      setError("Couldn't reach checkout. Please check your connection.");
      setProcessing(false);
    }
  }

  return (
    <div style={s.app}>
      <style>{css}</style>
      <nav style={s.nav}><div style={s.navInner}><a href="/" style={s.wordmark}>STALLWELL</a></div></nav>
      <div style={s.checkoutWrap}>
        <button style={s.backBtn} onClick={onBack}>← Back to bag</button>
        <div style={s.checkoutGrid}>
          <div style={s.checkoutLeft}>
            <h1 style={s.checkoutTitle}>Checkout</h1>
            <div style={s.checkoutCard}>
              <label style={s.checkoutLabel}>Email address</label>
              <input style={s.checkoutInput} type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
              <p style={s.checkoutHint}>Your receipt and shipping updates will be sent here.</p>
            </div>
            <div style={s.payMethods}>
              <p style={s.payMethodsLabel}>Accepted payments</p>
              <div style={s.payBadges}>
                {["Visa", "Mastercard", "Amex", " Pay", "G Pay"].map(m => <span key={m} style={s.payBadge}>{m}</span>)}
              </div>
            </div>
            {error && <p style={s.checkoutError}>{error}</p>}
            <button
              style={{ ...s.checkoutPayBtn, opacity: email.includes("@") && !processing ? 1 : 0.5 }}
              disabled={!email.includes("@") || processing}
              onClick={handlePay}
            >
              <Lock size={15} style={{ marginRight: 10 }} />
              {processing ? "Redirecting to secure payment…" : `Pay securely — ${currency(total)}`}
            </button>
            <p style={s.stripeNote}>Payments are processed securely by Stripe. We never see your card details.</p>
          </div>
          <div style={s.checkoutRight}>
            <p style={s.orderSummaryTitle}>Order summary</p>
            {items.map((i) => (
              <div key={i.id} style={s.orderItem}>
                <div style={s.orderItemImg}>
                  {i.image ? <img src={i.image} alt={i.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ color: "#6b7280", fontSize: 16, fontWeight: 700 }}>{i.name[0]}</span>}
                  <span style={s.orderQtyBadge}>{i.qty}</span>
                </div>
                <span style={s.orderItemName}>{i.name}</span>
                <span style={s.orderItemPrice}>{currency(i.qty * i.price)}</span>
              </div>
            ))}
            <div style={s.orderDivider} />
            <div style={s.orderRow}><span>Subtotal</span><span>{currency(subtotal)}</span></div>
            <div style={s.orderRow}><span>Shipping</span><span>{currency(shipping)}</span></div>
            <div style={{ ...s.orderRow, ...s.orderTotal }}><span>Total</span><span>{currency(total)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Success({ onShop }) {
  return (
    <div style={s.app}>
      <style>{css}</style>
      <nav style={s.nav}><div style={s.navInner}><a href="/" style={s.wordmark}>STALLWELL</a></div></nav>
      <div style={s.successWrap}>
        <div style={s.successIcon}>✓</div>
        <h1 style={s.successTitle}>Order confirmed</h1>
        <p style={s.successSub}>Thank you for your purchase. You'll receive a confirmation by email shortly — we'll get your order packed and on its way.</p>
        <button style={s.successBtn} onClick={onShop}>Continue shopping</button>
      </div>
    </div>
  );
}

// ─── DESIGN TOKENS & STYLES ─────────────────────────────────────────────────
const gold = "#c9a84c";
const navy = "#0a0f1e";
const navyMid = "#141929";
const navyLight = "#1e2640";
const pearl = "#f5f0e8";
const muted = "#8891a8";
const rose = "#e8b4b8";

const s = {
  app: { fontFamily: "'Inter', system-ui, sans-serif", background: navy, color: pearl, minHeight: "100vh" },

  // NAV
  nav: { position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: `${navy}ee`, backdropFilter: "blur(12px)", borderBottom: `1px solid ${navyLight}` },
  navInner: { maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" },
  wordmark: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 700, letterSpacing: "0.18em", color: gold, textDecoration: "none" },
  bagBtn: { position: "relative", background: "none", border: "none", color: pearl, cursor: "pointer", padding: 8, display: "flex", alignItems: "center" },
  bagCount: { position: "absolute", top: 2, right: 2, background: gold, color: navy, fontSize: 10, fontWeight: 800, borderRadius: "50%", width: 17, height: 17, display: "flex", alignItems: "center", justifyContent: "center" },

  // HERO
  hero: { minHeight: "100vh", display: "flex", alignItems: "center", position: "relative", overflow: "hidden", paddingTop: 64 },
  heroContent: { maxWidth: 1200, margin: "0 auto", padding: "80px 24px", position: "relative", zIndex: 2 },
  heroEyebrow: { fontFamily: "'Inter', sans-serif", fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: gold, fontWeight: 600, margin: "0 0 20px" },
  heroH1: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(48px, 7vw, 88px)", lineHeight: 1.05, margin: "0 0 24px", fontWeight: 700 },
  heroEm: { color: gold, fontStyle: "italic" },
  heroSub: { fontSize: 17, color: muted, lineHeight: 1.7, margin: "0 0 40px", maxWidth: 480 },
  heroCta: { display: "inline-flex", alignItems: "center", fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600, letterSpacing: "0.05em", background: "transparent", color: pearl, border: `1px solid ${navyLight}`, borderRadius: 40, padding: "14px 28px", cursor: "pointer", transition: "all 0.2s" },
  heroAccent: { position: "absolute", top: "10%", right: "-10%", width: "55%", height: "80%", background: `radial-gradient(ellipse at center, ${gold}0f 0%, transparent 70%)`, pointerEvents: "none", zIndex: 1 },

  // PRODUCTS SECTION
  productsSection: { maxWidth: 1200, margin: "0 auto", padding: "80px 24px 100px" },
  productsHeader: { marginBottom: 48 },
  sectionEyebrow: { fontFamily: "'Inter', sans-serif", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: gold, fontWeight: 600, margin: "0 0 12px" },
  sectionTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(28px, 4vw, 42px)", margin: 0, fontWeight: 700 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 24 },
  loadingRow: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 24 },
  skeleton: { height: 380, borderRadius: 16, background: navyMid },

  // PRODUCT CARD
  card: { background: navyMid, borderRadius: 16, overflow: "hidden", border: `1px solid ${navyLight}`, transition: "transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease", cursor: "default" },
  cardHovered: { transform: "translateY(-6px)", borderColor: gold + "60", boxShadow: `0 20px 60px ${navy}cc, 0 0 0 1px ${gold}22` },
  cardImgWrap: { position: "relative", aspectRatio: "1/1", background: navyLight, overflow: "hidden" },
  cardImg: { width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.4s ease" },
  cardImgPlaceholder: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" },
  cardImgInitial: { fontFamily: "'Playfair Display', serif", fontSize: 52, color: navyLight, fontWeight: 700 },
  soldOutBadge: { position: "absolute", top: 12, left: 12, background: `${navy}cc`, color: muted, fontSize: 10, fontFamily: "Inter, sans-serif", fontWeight: 600, letterSpacing: "0.08em", padding: "4px 10px", borderRadius: 20 },
  lowStockBadge: { position: "absolute", top: 12, left: 12, background: `${rose}22`, color: rose, fontSize: 10, fontFamily: "Inter, sans-serif", fontWeight: 600, letterSpacing: "0.06em", padding: "4px 10px", borderRadius: 20, border: `1px solid ${rose}44` },
  cardBody: { padding: "20px 20px 22px" },
  cardName: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, fontWeight: 600, margin: "0 0 6px", color: pearl },
  cardDetails: { fontSize: 13, color: muted, margin: "0 0 16px", lineHeight: 1.5 },
  cardFooter: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 },
  cardPrice: { fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: gold },
  addBtn: { fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", background: "transparent", color: pearl, border: `1px solid ${navyLight}`, borderRadius: 30, padding: "9px 18px", cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap" },
  addBtnHovered: { background: gold, color: navy, borderColor: gold },
  addBtnOut: { color: muted, borderColor: navyLight, cursor: "not-allowed" },

  // TRUST BAR
  trustBar: { borderTop: `1px solid ${navyLight}`, borderBottom: `1px solid ${navyLight}`, padding: "20px 24px", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "12px 40px", maxWidth: 1200, margin: "0 auto" },
  trustItem: { display: "flex", alignItems: "center", gap: 10 },
  trustDot: { width: 5, height: 5, borderRadius: "50%", background: gold, flexShrink: 0 },
  trustText: { fontSize: 13, color: muted, fontFamily: "Inter, sans-serif" },

  // FOOTER
  footer: { textAlign: "center", padding: "48px 24px", borderTop: `1px solid ${navyLight}`, marginTop: 40 },
  footerBrand: { fontFamily: "'Playfair Display', serif", fontSize: 18, letterSpacing: "0.18em", color: gold, margin: "0 0 8px" },
  footerSub: { fontSize: 13, color: muted, margin: "0 0 20px" },
  sellerLink: { fontSize: 12, color: navyLight, color: "#2e3550", textDecoration: "none", fontFamily: "Inter, sans-serif" },

  // CART DRAWER
  overlay: { position: "fixed", inset: 0, background: `${navy}99`, zIndex: 200, backdropFilter: "blur(4px)" },
  drawer: { position: "fixed", top: 0, right: 0, bottom: 0, width: "min(420px, 100vw)", background: navyMid, zIndex: 201, display: "flex", flexDirection: "column", transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)", boxShadow: `-20px 0 60px ${navy}` },
  drawerHeader: { padding: "20px 24px", borderBottom: `1px solid ${navyLight}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 },
  drawerTitle: { fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 600 },
  drawerCount: { color: gold, fontSize: 17 },
  drawerClose: { background: "none", border: "none", color: muted, cursor: "pointer", padding: 6 },
  drawerEmpty: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40 },
  drawerEmptyTitle: { fontFamily: "'Playfair Display', serif", fontSize: 20, margin: "0 0 8px" },
  drawerEmptySub: { fontSize: 14, color: muted, margin: "0 0 28px", textAlign: "center" },
  drawerShopBtn: { fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, background: "transparent", color: pearl, border: `1px solid ${navyLight}`, borderRadius: 30, padding: "11px 24px", cursor: "pointer" },
  drawerItems: { flex: 1, overflowY: "auto", padding: "16px 24px" },
  drawerItem: { display: "flex", gap: 14, paddingBottom: 18, marginBottom: 18, borderBottom: `1px solid ${navyLight}` },
  drawerItemImg: { width: 64, height: 64, borderRadius: 10, background: navyLight, flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" },
  drawerItemInitial: { fontFamily: "'Playfair Display', serif", fontSize: 24, color: muted },
  drawerItemName: { fontFamily: "'Playfair Display', serif", fontSize: 15, margin: "0 0 3px", fontWeight: 600 },
  drawerItemPrice: { fontSize: 13, color: muted, margin: "0 0 10px" },
  qtyRow: { display: "flex", alignItems: "center", gap: 10 },
  qtyBtn: { width: 26, height: 26, borderRadius: "50%", border: `1px solid ${navyLight}`, background: "transparent", color: pearl, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  qtyNum: { fontSize: 14, minWidth: 20, textAlign: "center", fontFamily: "Inter, sans-serif" },
  drawerLineTotal: { fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: gold },
  drawerRemove: { background: "none", border: "none", color: muted, cursor: "pointer", padding: 4 },
  drawerFooter: { padding: "20px 24px", borderTop: `1px solid ${navyLight}`, flexShrink: 0 },
  drawerSubtotalRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  drawerSubtotalLabel: { fontSize: 14, color: muted },
  drawerSubtotalValue: { fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: gold },
  drawerNote: { fontSize: 12, color: muted, margin: "0 0 16px" },
  checkoutBtn: { width: "100%", fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: "0.04em", background: gold, color: navy, border: "none", borderRadius: 12, padding: "15px 24px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },

  // CHECKOUT PAGE
  checkoutWrap: { maxWidth: 1100, margin: "0 auto", padding: "100px 24px 80px" },
  backBtn: { background: "none", border: "none", color: muted, fontSize: 14, cursor: "pointer", padding: 0, marginBottom: 36, fontFamily: "Inter, sans-serif" },
  checkoutGrid: { display: "grid", gridTemplateColumns: "1fr 420px", gap: 60, alignItems: "start" },
  checkoutLeft: { display: "flex", flexDirection: "column", gap: 20 },
  checkoutTitle: { fontFamily: "'Playfair Display', serif", fontSize: 38, margin: "0 0 8px" },
  checkoutCard: { background: navyMid, border: `1px solid ${navyLight}`, borderRadius: 16, padding: 24 },
  checkoutLabel: { display: "block", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: muted, marginBottom: 10 },
  checkoutInput: { width: "100%", background: navyLight, border: `1px solid ${navyLight}`, color: pearl, fontFamily: "Inter, sans-serif", fontSize: 16, padding: "14px 16px", borderRadius: 10, boxSizing: "border-box" },
  checkoutHint: { fontSize: 12, color: muted, margin: "10px 0 0" },
  payMethods: {},
  payMethodsLabel: { fontSize: 12, color: muted, margin: "0 0 10px", letterSpacing: "0.06em", textTransform: "uppercase" },
  payBadges: { display: "flex", flexWrap: "wrap", gap: 8 },
  payBadge: { fontSize: 12, fontWeight: 700, background: navyMid, border: `1px solid ${navyLight}`, color: muted, padding: "6px 14px", borderRadius: 8 },
  checkoutError: { fontSize: 13, color: "#f87171", background: "#f8717122", border: "1px solid #f8717133", borderRadius: 8, padding: "12px 16px", margin: 0 },
  checkoutPayBtn: { width: "100%", fontFamily: "Inter, sans-serif", fontSize: 15, fontWeight: 700, letterSpacing: "0.04em", background: gold, color: navy, border: "none", borderRadius: 14, padding: "17px 24px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  stripeNote: { fontSize: 12, color: muted, textAlign: "center", margin: 0 },
  checkoutRight: { background: navyMid, border: `1px solid ${navyLight}`, borderRadius: 16, padding: 28, position: "sticky", top: 90 },
  orderSummaryTitle: { fontFamily: "'Playfair Display', serif", fontSize: 18, margin: "0 0 20px", fontWeight: 600 },
  orderItem: { display: "flex", alignItems: "center", gap: 14, marginBottom: 16 },
  orderItemImg: { width: 52, height: 52, borderRadius: 10, background: navyLight, flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" },
  orderQtyBadge: { position: "absolute", top: -6, right: -6, background: muted, color: navy, fontSize: 10, fontWeight: 800, borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center" },
  orderItemName: { flex: 1, fontSize: 14, fontFamily: "'Playfair Display', serif" },
  orderItemPrice: { fontSize: 14, color: gold, fontWeight: 700, fontFamily: "'Playfair Display', serif" },
  orderDivider: { height: 1, background: navyLight, margin: "16px 0" },
  orderRow: { display: "flex", justifyContent: "space-between", fontSize: 14, color: muted, padding: "4px 0", fontFamily: "Inter, sans-serif" },
  orderTotal: { fontFamily: "'Playfair Display', serif", fontSize: 20, color: pearl, fontWeight: 700, marginTop: 8 },

  // SUCCESS
  successWrap: { maxWidth: 560, margin: "0 auto", padding: "140px 24px 80px", textAlign: "center" },
  successIcon: { width: 64, height: 64, borderRadius: "50%", background: `${gold}22`, border: `2px solid ${gold}`, color: gold, fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px" },
  successTitle: { fontFamily: "'Playfair Display', serif", fontSize: 38, margin: "0 0 16px" },
  successSub: { fontSize: 16, color: muted, lineHeight: 1.7, margin: "0 0 36px" },
  successBtn: { fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 700, background: gold, color: navy, border: "none", borderRadius: 12, padding: "14px 32px", cursor: "pointer" },

  // TOAST
  toast: { position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: pearl, color: navy, fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, padding: "12px 22px", borderRadius: 40, boxShadow: "0 8px 32px rgba(0,0,0,0.4)", zIndex: 999, whiteSpace: "nowrap" },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600;1,700&family=Inter:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${navy}; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: ${navyMid}; }
  ::-webkit-scrollbar-thumb { background: ${navyLight}; border-radius: 3px; }
  input:focus { outline: 2px solid ${gold}; outline-offset: 2px; border-color: ${gold} !important; }
  button:focus-visible { outline: 2px solid ${gold}; outline-offset: 2px; }
  .skeleton { animation: shimmer 1.6s ease-in-out infinite; }
  @keyframes shimmer { 0%,100% { opacity: 0.4; } 50% { opacity: 0.8; } }
  .toast-in { animation: toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1); }
  @keyframes toastIn { from { opacity:0; transform: translateX(-50%) translateY(12px); } to { opacity:1; transform: translateX(-50%) translateY(0); } }
  @media (max-width: 768px) {
    .checkout-grid { grid-template-columns: 1fr !important; }
  }
`;
