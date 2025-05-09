// components/EditableBio.js
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';
import Head from 'next/head';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * EditableBio
 * 
 * Minimal code to store user’s bio, social handles, & “looking for work” 
 * in your Supabase DB — no on-chain ENS text record updates, 
 * letting EFP or other systems handle “official” on-chain data.
 */
export default function EditableBio({
  ensName,
  connectedAddress,
  initialBio = '',
  initialLooking = false,
  showAIGenerator = false,
  experience = '',
  setExperience = () => {},
  lastSaved = null,
  setLastSaved = () => {}
}) {
  const [bio, setBio] = useState(initialBio);
  const [editing, setEditing] = useState(false);
  const [lookingForWork, setLookingForWork] = useState(initialLooking);
  const [loadingAI, setLoadingAI] = useState(false);
  const [saving, setSaving] = useState(false);

  // For local use only; won't attempt on-chain record setting
  const [twitter, setTwitter] = useState('');
  const [website, setWebsite] = useState('');
  const [farcaster, setFarcaster] = useState('');

  // On mount/update, sync local state with passed props
  useEffect(() => {
    setBio(initialBio);
    setLookingForWork(initialLooking);
  }, [initialBio, initialLooking]);

  /**
   * Save data to Supabase "ProfileCard" (or whichever) table
   * 
   * NOTE: We remove the old `resolver.setText(...)` calls
   * that tried to set ENS records on chain. 
   * So now we only store in DB, leaving EFP or your new approach in ProfileCard 
   * to manage “real” social & follower data.
   */
  const handleSave = async () => {
    if (saving) return;

    if (!connectedAddress) {
      toast.error('Wallet not connected');
      return;
    }

    try {
      setSaving(true);
      // Upsert to your DB table
      const now = new Date().toISOString();
      const { error } = await supabase.from('ProfileCard').upsert({
        address: connectedAddress,
        bio,
        twitter,
        website,
        farcaster,
        // Possibly set some tag or "open" if lookingForWork
        tag: lookingForWork ? 'open' : null,
        updated_at: now
      });

      if (error) throw error;

      toast.success('Profile saved successfully!');
      setLastSaved(now);
      setEditing(false);
    } catch (err) {
      console.error('Failed to save bio:', err);
      toast.error('Failed to save bio.');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Optionally generate a user bio from an AI endpoint, if showAIGenerator is true
   */
  const handleAIGenerate = async () => {
    setLoadingAI(true);
    try {
      const response = await fetch('/api/generate-bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Write a short, professional Web3 bio for ${ensName || connectedAddress}.`,
          auto: false
        })
      });

      const data = await response.json();
      if (data.bio) {
        setBio(data.bio);
      } else {
        toast.error('AI did not return a valid bio.');
      }
    } catch (err) {
      console.error('AI generation failed:', err);
      toast.error('Failed to generate bio.');
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Cal+Sans:wght@600&display=swap"
          rel="stylesheet"
        />
      </Head>
      <div className="space-y-4">
        {editing ? (
          <>
            <textarea
              className="w-full p-2 border border-gray-300 rounded-lg"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled={loadingAI || saving}
              placeholder="Enter a short bio about yourself"
            />

            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded-lg"
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              placeholder="Twitter handle (e.g., @yourhandle)"
            />

            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded-lg"
              value={farcaster}
              onChange={(e) => setFarcaster(e.target.value)}
              placeholder="Farcaster username"
            />

            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded-lg"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="Website URL"
            />

            <textarea
              className="w-full p-2 border border-gray-300 rounded-lg mt-2"
              rows={4}
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              disabled={saving}
              placeholder="List relevant roles, projects, or achievements"
            />

            <div className="flex items-center gap-2 flex-wrap mt-2">
              <label className="flex items-center gap-1 text-sm" htmlFor="lookingForWork">
                <input
                  id="lookingForWork"
                  type="checkbox"
                  checked={lookingForWork}
                  onChange={() => setLookingForWork(!lookingForWork)}
                />
                Looking for Work
              </label>

              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>

              {showAIGenerator && (
                <button
                  onClick={handleAIGenerate}
                  disabled={loadingAI}
                  className="px-3 py-2 bg-gray-200 text-sm rounded-lg hover:bg-gray-300"
                >
                  {loadingAI ? 'Thinking...' : '✍️ Generate with AI'}
                </button>
              )}
            </div>
          </>
        ) : (
          <div
            onClick={() => setEditing(true)}
            className="cursor-pointer"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setEditing(true)}
            aria-label="Click to edit bio"
          >
            <p className="text-gray-700 text-lg" style={{ fontFamily: 'Cal Sans, sans-serif' }}>
              {bio || 'Connect your wallet to customize your profile page'}
            </p>
            {lookingForWork && (
              <p className="text-green-600 text-xs font-semibold mt-1">✅ Open to Work</p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
