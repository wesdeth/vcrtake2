// pages/api/create-subscription.js

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { walletAddress } = req.body;

  if (!walletAddress) {
    return res.status(400).json({ error: 'Missing wallet address' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: process.env.STRIPE_MONTHLY_SUBSCRIPTION_PRICE_ID,
          quantity: 1,
        },
      ],
      metadata: {
        walletAddress,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cancel`,
    });

    return res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('❌ Stripe subscription error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
