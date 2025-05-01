
import { useState } from 'react';

export default function EditableBio({ initialBio }) {
  const [bio, setBio] = useState(initialBio);
  const [editing, setEditing] = useState(false);

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
          <button
            className="mt-2 bg-blue-600 text-white px-3 py-1 rounded"
            onClick={() => setEditing(false)}
          >
            Save
          </button>
        </>
      ) : (
        <>
          <p className="text-gray-800">{bio || 'No bio set'}</p>
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
