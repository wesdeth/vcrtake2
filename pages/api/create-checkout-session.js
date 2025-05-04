// pages/api/create-checkout-session.js
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { ensName } = req.body;

  const { data: user, error } = await supabase
    .from('VCR')
    .select('*')
    .eq('ens_name', ensName)
    .single();

  if (error || !user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Download Verified Resume',
          description: `Verified PDF for ${ensName}`,
        },
        unit_amount: 1000, // $10
      },
      quantity: 1,
    }],
    success_url: `${req.headers.origin}/preview/${ensName}?success=true`,
    cancel_url: `${req.headers.origin}/preview/${ensName}?canceled=true`,
    metadata: {
      ens_name: ensName,
    },
  });

  res.status(200).json({ url: session.url });
}
