// pages/api/create-subscription.js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { walletAddress } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_MONTHLY_SUB_PRICE_ID, // set this in your Stripe Dashboard
          quantity: 1,
        },
      ],
      metadata: { walletAddress },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/resume?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/resume?canceled=true`,
    });

    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: 'Failed to create Stripe session' });
  }
}
