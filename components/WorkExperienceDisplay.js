// components/EditableWorkExperience.js
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function EditableWorkExperience({ ensName, address }) {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [startDate, setStartDate] = useState('');
  const [location, setLocation] = useState('');
  const [experience, setExperience] = useState('');
  const [logo, setLogo] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('VCR').upsert({
      ens_name: ensName,
      address,
      custom_title: title,
      company,
      start_date: startDate,
      location,
      experience,
      logo
    });

    if (error) {
      toast.error('Failed to save work experience.');
    } else {
      toast.success('Work experience saved!');
    }
    setSaving(false);
  };

  return (
    <section className="mt-8 px-6 py-5 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl shadow max-w-3xl mx-auto">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Edit Work Experience</h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <input
          type="text"
          placeholder="Job Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border rounded px-3 py-2"
        />
        <input
          type="text"
          placeholder="Company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="border rounded px-3 py-2"
        />
        <input
          type="text"
          placeholder="Start Date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border rounded px-3 py-2"
        />
        <input
          type="text"
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="border rounded px-3 py-2"
        />
        <input
          type="text"
          placeholder="Logo URL"
          value={logo}
          onChange={(e) => setLogo(e.target.value)}
          className="border rounded px-3 py-2"
        />
      </div>

      <textarea
        placeholder="Work Experience Description"
        value={experience}
        onChange={(e) => setExperience(e.target.value)}
        className="border rounded px-3 py-2 mt-4 w-full h-24"
      />

      <button
        onClick={handleSave}
        className={`mt-4 px-4 py-2 rounded text-white ${saving ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
        disabled={saving}
      >
        {saving ? 'Saving...' : 'Save Work Experience'}
      </button>
    </section>
  );
}
