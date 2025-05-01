import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export default function EditableBio({ initialBio = '', initialLooking = false }) {
  const [bio, setBio] = useState(initialBio);
  const [editing, setEditing] = useState(false);
  const [lookingForWork, setLookingForWork] = useState(initialLooking);

  useEffect(() => {
    setBio(initialBio);
    setLookingForWork(initialLooking);
  }, [initialBio, initialLooking]);

  const handleSave = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();
        const ensName = await provider.lookupAddress(userAddress);
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
