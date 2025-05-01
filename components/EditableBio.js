import { useState, useEffect } from 'react';

export default function EditableBio({ initialBio }) {
  const [bio, setBio] = useState(initialBio);
  const [editing, setEditing] = useState(false);
  const [lookingForWork, setLookingForWork] = useState(false);

  useEffect(() => {
    setBio(initialBio);
  }, [initialBio]);

  const handleSave = () => {
    // Placeholder for save logic (e.g. API or ENS text record)
    setEditing(false);
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
      {editing ? (
        <>
          <textarea
            className="w-full p-2 border rounded"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
          <div className="flex items-center mt-2 space-x-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={lookingForWork}
                onChange={() => setLookingForWork(!lookingForWork)}
              />
              Looking for Work
            </label>
            <button
              className="bg-blue-600 text-white px-3 py-1 rounded"
              onClick={handleSave}
            >
              Save
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-gray-800">{bio || 'No bio set'}</p>
          {lookingForWork && (
            <p className="text-green-600 text-xs font-semibold mt-1">✅ Open to Work</p>
          )}
          <button
            className="mt-1 text-blue-500 text-sm"
            onClick={() => setEditing(true)}
          >
            Edit Bio
          </button>
        </>
      )}
    </div>
  );
}
