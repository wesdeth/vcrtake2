import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export default function EditableBio({ ensName, connectedAddress, initialBio = '', initialLooking = false, showAIGenerator = false }) {
  console.log("EditableBio props", {
    ensName,
    connectedAddress,
    initialBio,
    initialLooking,
    showAIGenerator,
    typeOfEnsName: typeof ensName
  });

  const [bio, setBio] = useState(initialBio);
  const [editing, setEditing] = useState(false);
  const [lookingForWork, setLookingForWork] = useState(initialLooking);
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    setBio(initialBio);
    setLookingForWork(initialLooking);
  }, [initialBio, initialLooking]);

  const handleSave = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const resolver = await provider.getResolver(ensName);

        if (resolver) {
          await resolver.connect(signer).setText('description', bio);
          await resolver.connect(signer).setText('lookingForWork', lookingForWork ? 'true' : 'false');
        }
      }
      setEditing(false);
    } catch (err) {
      console.error('Failed to save ENS text records:', err);
    }
  };

  const handleAIGenerate = async () => {
    setLoadingAI(true);
    try {
      const response = await fetch('/api/generate-bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ensName })
      });

      const data = await response.json();
      if (data.bio) {
        setBio(data.bio);
      }
    } catch (err) {
      console.error('AI generation failed:', err);
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
          />

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={lookingForWork}
                onChange={() => setLookingForWork(!lookingForWork)}
              />
              Looking for Work
            </label>

            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg"
            >
              Save
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
        <div onClick={() => setEditing(true)} className="cursor-pointer">
          <p className="text-gray-700">{bio || 'Click to add a short bio about yourself'}</p>
          {lookingForWork && (
            <p className="text-green-600 text-xs font-semibold mt-1">✅ Open to Work</p>
          )}
        </div>
      )}
    </div>
  );
}
