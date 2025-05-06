// components/EditableBio.js
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

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
  const [twitter, setTwitter] = useState('');
  const [website, setWebsite] = useState('');

  useEffect(() => {
    setBio(initialBio);
    setLookingForWork(initialLooking);
  }, [initialBio, initialLooking]);

  const handleSave = async () => {
    if (saving) return;

    if (!connectedAddress) {
      toast.error('Wallet not connected');
      return;
    }

    try {
      setSaving(true);
      if (ensName.endsWith('.eth')) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const resolver = await provider.getResolver(ensName);

        if (!resolver) {
          toast.error('ENS name does not have a resolver configured.');
          return;
        }

        const connectedResolver = resolver.connect(signer);
        await connectedResolver.setText('description', bio);
        await connectedResolver.setText('lookingForWork', lookingForWork ? 'true' : 'false');
        if (twitter) await connectedResolver.setText('com.twitter', twitter);
        if (website) await connectedResolver.setText('url', website);
      }

      const now = new Date().toISOString();
      const { error } = await supabase.from('VCR').upsert({
        ens_name: ensName,
        bio,
        lookingForWork,
        experience,
        updated_at: now,
        twitter,
        website
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

  const handleAIGenerate = async () => {
    setLoadingAI(true);
    try {
      const response = await fetch('/api/generate-bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ensName, previousBio: bio })
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
      <link href="https://fonts.googleapis.com/css2?family=Cal+Sans:wght@600&display=swap" rel="stylesheet" />
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
            <p className="text-gray-700 text-lg" style={{ fontFamily: 'Cal Sans, sans-serif', fontWeight: 600 }}>
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
