// /components/EditableBio.js
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

export default function EditableBio({
  ensName,
  connectedAddress,
  initialBio = '',
  initialLooking = false,
  showAIGenerator = false
}) {
  const [bio, setBio] = useState(initialBio);
  const [editing, setEditing] = useState(false);
  const [lookingForWork, setLookingForWork] = useState(initialLooking);
  const [loadingAI, setLoadingAI] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setBio(initialBio);
    setLookingForWork(initialLooking);
  }, [initialBio, initialLooking]);

  const handleSave = async () => {
    if (saving) return;

    if (!ensName || typeof window === 'undefined' || !window.ethereum) {
      toast.error('Wallet not detected');
      return;
    }

    try {
      setSaving(true);
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

      toast.success('Profile saved successfully!');
      setEditing(false);
    } catch (err) {
      console.error('Failed to save ENS text records:', err);
      toast.error('Failed to save.');
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

          <div className="flex items-center gap-2 flex-wrap">
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
          <p className="text-gray-700">{bio || 'Click to add a short bio about yourself'}</p>
          {lookingForWork && (
            <p className="text-green-600 text-xs font-semibold mt-1">✅ Open to Work</p>
          )}
        </div>
      )}
    </div>
  );
}
