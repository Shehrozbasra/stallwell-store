import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { items, email } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "No items provided" });
    }

    const line_items = items.map((item) => ({
      price_data: {
        currency: "gbp",
        product_data: {
          name: item.name,
          images: item.image && item.image.startsWith("http") ? [item.image] : [],
        },
        unit_amount: Math.round(item.price * 100), // Stripe uses cents
      },
      quantity: item.qty,
    }));

    const origin = req.headers.origin || `https://${req.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"], // Apple Pay / Google Pay show automatically
      // when the browser supports them — no extra setup needed.
      line_items,
      customer_email: email || undefined,
      shipping_address_collection: { allowed_countries: ["US", "GB", "CA", "AU", "PK", "IN"] },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: 450, currency: "gbp" },
            display_name: "Standard shipping",
          },
        },
      ],
      success_url: `${origin}/?payment=success`,
      cancel_url: `${origin}/?payment=cancelled`,
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
