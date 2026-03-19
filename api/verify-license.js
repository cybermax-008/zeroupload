export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { key } = req.body || {};
  if (!key || typeof key !== 'string') {
    return res.status(400).json({ valid: false, error: 'License key required' });
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) {
    return res.status(500).json({ valid: false, error: 'Server configuration error' });
  }

  try {
    // Verify the session with Stripe API
    const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${key}`, {
      headers: { 'Authorization': `Bearer ${stripeSecret}` },
    });

    if (!response.ok) {
      return res.status(200).json({ valid: false, error: 'Invalid license key' });
    }

    const session = await response.json();

    if (session.payment_status === 'paid') {
      return res.status(200).json({ valid: true });
    }

    return res.status(200).json({ valid: false, error: 'Payment not completed' });
  } catch (err) {
    return res.status(500).json({ valid: false, error: 'Verification failed' });
  }
}
