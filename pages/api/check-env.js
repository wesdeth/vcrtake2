// pages/api/check-env.js
export default function handler(req, res) {
  const key = process.env.OPENAI_API_KEY;
  if (key) {
    res.status(200).json({ success: true, keyExists: true });
  } else {
    res.status(500).json({ success: false, message: 'OPENAI_API_KEY not found in environment' });
  }
}
