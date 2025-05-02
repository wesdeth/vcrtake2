import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { ensName } = req.body;

  if (!ensName) {
    return res.status(400).json({ error: 'ENS name is required' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Verified Chain Resume for ${ensName}`,
              description: 'PDF download of your blockchain resume',
            },
            unit_amount: 1000, // $10
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/preview/${ensName}?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/preview/${ensName}?cancelled=true`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('❌ Stripe session error:', err.message);
    return res.status(500).json({ error: 'Something went wrong with Stripe' });
  }
}
