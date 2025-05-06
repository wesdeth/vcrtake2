// components/EditableWorkExperience.js
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function EditableWorkExperience({ ensName, initialExperience = [], setExperience }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [entries, setEntries] = useState(initialExperience);

  const handleChange = (index, field, value) => {
    const updated = [...entries];
    updated[index][field] = value;
    setEntries(updated);
  };

  const handleSave = async () => {
    const { error } = await supabase.from('VCR').upsert({
      ens_name: ensName,
      experience: entries,
    });
    if (error) {
      toast.error('Failed to save experience');
    } else {
      toast.success('Experience saved');
      setExperience(entries);
      setEditingIndex(null);
    }
  };

  const addEntry = () => {
    setEntries([...entries, { title: '', company: '', startDate: '', location: '', description: '', logo: '' }]);
    setEditingIndex(entries.length);
  };

  const removeEntry = (index) => {
    const updated = entries.filter((_, i) => i !== index);
    setEntries(updated);
    setExperience(updated);
  };

  return (
    <div className="mt-6 bg-white border border-gray-300 rounded-lg p-4 space-y-4">
      <h3 className="text-lg font-semibold">Work Experience</h3>

      {entries.map((exp, i) => (
        <div key={i} className="border rounded p-3">
          <input
            className="w-full mb-2 p-2 border rounded"
            placeholder="Title"
            value={exp.title}
            onChange={(e) => handleChange(i, 'title', e.target.value)}
          />
          <input
            className="w-full mb-2 p-2 border rounded"
            placeholder="Company"
            value={exp.company}
            onChange={(e) => handleChange(i, 'company', e.target.value)}
          />
          <input
            className="w-full mb-2 p-2 border rounded"
            placeholder="Start Date"
            value={exp.startDate}
            onChange={(e) => handleChange(i, 'startDate', e.target.value)}
          />
          <input
            className="w-full mb-2 p-2 border rounded"
            placeholder="Location"
            value={exp.location}
            onChange={(e) => handleChange(i, 'location', e.target.value)}
          />
          <textarea
            className="w-full mb-2 p-2 border rounded"
            placeholder="Description"
            value={exp.description}
            onChange={(e) => handleChange(i, 'description', e.target.value)}
          />
          <input
            className="w-full mb-2 p-2 border rounded"
            placeholder="Logo URL"
            value={exp.logo}
            onChange={(e) => handleChange(i, 'logo', e.target.value)}
          />
          <button onClick={() => removeEntry(i)} className="text-red-600 text-sm mt-2">
            Remove
          </button>
        </div>
      ))}

      <div className="flex gap-2">
        <button onClick={addEntry} className="bg-blue-500 text-white px-4 py-2 rounded">
          Add Role
        </button>
        <button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded">
          Save All
        </button>
      </div>
    </div>
  );
}
