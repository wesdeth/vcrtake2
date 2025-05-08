// components/ProfileCard.js – finalized complete file
import { useState, useEffect } from 'react';
import {
  Copy,
  Twitter,
  Link as LinkIcon,
  UserPlus2,
  ChevronDown,
  ChevronUp,
  Edit,
  Save,
  Upload,
  ExternalLink,
  PlusCircle,
  Trash2,
  CheckCircle,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import axios from 'axios';

/* ------------------------------------------------------------------
   Utility helpers
-------------------------------------------------------------------*/
const shortenAddress = (addr = '') => (addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '');

const parseDate = (d) => {
  if (!d) return null;
  const p = Date.parse(d.replace(/\//g, '-'));
  return Number.isNaN(p) ? null : new Date(p);
};

const formatRange = (s, e, current) => {
  if (!s) return '';
  const start = parseDate(s)?.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
  const end = current
    ? 'Present'
    : parseDate(e)?.toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) || '';
  return `${start} – ${end}`;
};

/* ------------------------------------------------------------------
   Tag options (capitalized)
-------------------------------------------------------------------*/
const TAG_OPTIONS = [
  'Ai', 'Analyst', 'Backend', 'Bitcoin', 'Blockchain', 'Community Manager', 'Crypto', 'Cryptography', 'Cto',
  'Customer Support', 'Dao', 'Data Science', 'Defi', 'Design', 'Developer Relations', 'Devops', 'Discord',
  'Economy Designer', 'Entry Level', 'Erc', 'Erc 20', 'Evm', 'Front End', 'Full Stack', 'Gaming', 'Ganache',
  'Golang', 'Hardhat', 'Intern', 'Java', 'Javascript', 'Layer 2', 'Marketing', 'Mobile', 'Moderator', 'Nft',
  'Node', 'Non Tech', 'Open Source', 'Openzeppelin', 'Pay In Crypto', 'Product Manager', 'Project Manager',
  'React', 'Refi', 'Research', 'Ruby', 'Rust', 'Sales', 'Smart Contract', 'Solana', 'Solidity', 'Truffle',
  'Web3 Py', 'Web3js', 'Zero Knowledge', 'Founder'
];

/* ------------------------------------------------------------------
   SocialLink sub‑component
-------------------------------------------------------------------*/
const SocialLink = ({ href, icon: Icon, label }) =>
  href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
    >
      <Icon size={16} /> {label}
    </a>
  ) : null;

/* ------------------------------------------------------------------
   ProfileCard component
-------------------------------------------------------------------*/
export default function ProfileCard({ data = {} }) {
  const {
    name,
    address,
    avatar,
    twitter,
    website,
    tag,
    efpLink,
    warpcast,
    poaps = [],
    nfts = [],
    ownsProfile = false,
    workExperience = [],
    bio = '',
    ensBio = ''
  } = data;

  /* -------------------------- state ---------------------------*/
  const [showAllPoaps, setShowAllPoaps] = useState(false);
  const [poapData, setPoapData] = useState(poaps);
  const [editing, setEditing] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const [uploadedAvatar, setUploadedAvatar] = useState(avatar || '/default-avatar.png');
  const [editTwitter, setEditTwitter] = useState(twitter || '');
  const [editWebsite, setEditWebsite] = useState(website || '');
  const [editWarpcast, setEditWarpcast] = useState(warpcast || '');
  const [editTag, setEditTag] = useState(tag || '');
  const [editBio, setEditBio] = useState(bio || ensBio);
  const [editExp, setEditExp] = useState(workExperience);

  const { address: connected } = useAccount();
  const isOwner = ownsProfile || (connected && address && connected.toLowerCase() === address.toLowerCase());

  /* ------------------------ effects ---------------------------*/
  useEffect(() => {
    const fetchPoaps = async () => {
      if (!address) return;
      try {
        const r = await axios.get(`https://api.poap.tech/actions/scan/${address}`, {
          headers: { 'X-API-Key': process.env.NEXT_PUBLIC_POAP_API_KEY || 'demo' }
        });
        setPoapData(r.data || []);
      } catch (err) {
        console.error('POAP fetch error', err);
        setPoapData([]);
      }
    };

    const fetchAvatar = async () => {
      if (avatar || !address) return;
      try {
        const r = await axios.get(`https://api.opensea.io/api/v1/user/${address}`);
        const img = r.data?.account?.profile_img_url || r.data?.profile_img_url;
        if (img) setUploadedAvatar(img);
      } catch {
        // fallback already set
      }
    };

    fetchPoaps();
    fetchAvatar();
  }, [address, avatar]);

  /* ----------------------- handlers ---------------------------*/
  const handleSave = async () => {
    try {
      const res = await fetch('/api/save-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ensName: name,
          address,
          twitter: editTwitter,
          warpcast: editWarpcast,
          website: editWebsite,
          tag: editTag,
          bio: editBio,
          custom_avatar: uploadedAvatar,
          experience: editExp.map((e) => ({
            ...e,
            startDate: e.startDate || '',
            endDate: e.currentlyWorking ? null : e.endDate || '',
            currentlyWorking: !!e.currentlyWorking,
            location: e.location || '',
            description: e.description || ''
          }))
        })
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Unknown error');
      setEditing(false);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
    } catch (err) {
      console.error('save-profile error', err);
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setUploadedAvatar(reader.result);
    reader.readAsDataURL(file);
  };

  const updateExp = (i, field, val) =>
    setEditExp((prev) => prev.map((e, idx) => (idx === i ? { ...e, [field]: val } : e)));

  const toggleCurrent = (i) =>
    setEditExp((prev) =>
      prev.map((e, idx) =>
        idx === i ? { ...e, currentlyWorking: !e.currentlyWorking, endDate: e.currentlyWorking ? '' : e.endDate } : e
      )
    );

  const addExp = () =>
    setEditExp((prev) => [
      ...prev,
      { title: '', company: '', startDate: '', endDate: '', location: '', description: '', currentlyWorking: false }
    ]);

  const removeExp = (i) => setEditExp((prev) => prev.filter((_, idx) => idx !== i));

  /* ------------------------ derived ---------------------------*/
  const poapsToShow = Array.isArray(poapData) ? (showAllPoaps ? poapData : poapData.slice(0, 4)) : [];
  const nftsToShow = Array.isArray(nfts) ? nfts.slice(0, 6) : [];

  /* ------------------------------------------------------------------
     component JSX
  ------------------------------------------------------------------*/
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative w-full max-w-lg mx-auto rounded-3xl overflow-hidden shadow-2xl ring-1 ring-indigo-200/60 border border-white/10"
    >
      {/* animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-100 to-cyan-100 opacity-40 animate-gradient-radial blur-2xl" />

      {/* content wrapper */}
      <div className="relative z-10 p-8 sm:p-10 text-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
        {/* avatar */}
        <div className="relative w-32 h-32 mx-auto -mt-24 mb-4">
          <img
            src={uploadedAvatar}
            alt="avatar"
            className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
          />
          {isOwner && editing && (
            <label className="absolute bottom-0 right-0 p-1 bg-gray-800/80 rounded-full cursor-pointer hover:bg-gray-700/80">
              <Upload size={14} className="text-white" />
              <input type="file" accept="image/*" hidden onChange={handleAvatarUpload} />
            </label>
          )}
        </div>

        {/* name */}
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-800 dark:text-white">
          {name || shortenAddress(address)}
        </h2>

        {/* address copy */}
        {address && (
          <p
            className="inline-flex items-center gap-1 text-xs sm:text-sm mx-auto text-indigo-600 dark:text-indigo-300 mt-1 cursor-pointer justify-center"
            title="Copy address"
            onClick={() => navigator.clipboard.writeText(address)}
          >
            {shortenAddress(address)} <Copy size={12} />
          </p>
        )}

        {/* bio */}
        {editing ? (
          <textarea
            value={editBio}
            onChange={(e) => setEditBio(e.target.value)}
            rows={3}
            className="mt-3 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl p-3 text-sm"
            placeholder="Add a short bio..."
          />
        ) : (
          editBio && <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">{editBio}</p>
        )}

        {/* socials */}
        {editing ? (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <input
              placeholder="Twitter handle"
              value={editTwitter}
              onChange={(e) => setEditTwitter(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-sm w-full"
            />
            <input
              placeholder="Warpcast handle"
              value={editWarpcast}
              onChange={(e) => setEditWarpcast(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-sm w-full"
            />
            <input
              placeholder="Website"
              value={editWebsite}
              onChange={(e) => setEditWebsite(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-sm w-full"
            />
            <input
              placeholder="Custom tag"
              value={editTag}
              onChange={(e) => setEditTag(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-sm w-full"
            />
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <SocialLink
              href={editTwitter ? `https://twitter.com/${editTwitter.replace(/^@/, '')}` : null}
              icon={Twitter}
              label="Twitter"
            />
            <SocialLink
              href={editWarpcast ? `https://warpcast.com/${editWarpcast.replace(/^@/, '')}` : null}
              icon={UserPlus2}
              label="Warpcast"
            />
            <SocialLink
              href={editWebsite ? (editWebsite.startsWith('http') ? editWebsite : `https://${editWebsite}`) : null}
              icon={LinkIcon}
              label="Website"
            />
            {editTag && <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs bg-indigo-100 text-indigo-800">{editTag}</span>}
          </div>
        )}

        {/* work experience */}
        <div className="mt-8 text-left">
          <h3 className="text-lg font-bold mb-3 text-gray-800 dark:text-white flex items-center">
            Experience {editing && (
              <button
                onClick={addExp}
                className="ml-2 inline-flex items-center text-xs text-blue-500 hover:underline"
              >
                <PlusCircle size={14} className="mr-0.5" /> Add
              </button>
            )}
          </h3>

          {editExp.length === 0 && !editing && (
            <p className="text-sm text-gray-500">No experience added yet.</p>
          )}

          {editExp.map((exp, i) => (
            <div key={i} className="mb-4 last:mb-0">
              {editing ? (
                <>
                  <div className="grid sm:grid-cols-2 gap-2">
                    <input
                      className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-sm w-full"
                      placeholder="Job title"
                      value={exp.title}
                      onChange={(e) => updateExp(i, 'title', e.target.value)}
                    />
                    <input
                      className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-sm w-full"
                      placeholder="Company"
                      value={exp.company}
                      onChange={(e) => updateExp(i, 'company', e.target.value)}
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2 mt-2">
                    <input
                      type="date"
                      className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-sm w-full"
                      value={exp.startDate}
                      onChange={(e) => updateExp(i, 'startDate', e.target.value)}
                    />
                    {!exp.currentlyWorking && (
                      <input
                        type="date"
                        className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-sm w-full"
                        value={exp.endDate}
                        onChange={(e) => updateExp(i, 'endDate', e.target.value)}
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <label className="flex items-center text-xs gap-1 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={exp.currentlyWorking}
                        onChange={() => toggleCurrent(i)}
                        className="h-4 w-4 text-indigo-600 rounded"
                      />
                      Currently working here
                    </label>
                    <button
                      onClick={() => removeExp(i)}
                      className="ml-auto text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Role description"
                    value={exp.description}
                    onChange={(e) => updateExp(i, 'description', e.target.value)}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-sm mt-2"
                  />
                </>
              ) : (
                <>
                  <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">
                    {exp.title}{exp.company && ` • ${exp.company}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatRange(exp.startDate, exp.endDate, exp.currentlyWorking)}
                    {exp.location && ` • ${exp.location}`}
                  </p>
                  {exp.description && <p className="text-sm mt-1 text-gray-600 dark:text-gray-300 whitespace-pre-line">{exp.description}</p>}
                </>
              )}
            </div>
          ))}
        </div>

        {/* POAPs */}
        {poapsToShow.length > 0 && (
          <div className="mt-8 text-left">
            <h3 className="text-lg font-bold mb-1 text-gray-800 dark:text-white">POAPs</h3>
            <div className="grid grid-cols-2 gap-2">
              {poapsToShow.map((poap, i) => (
                <div key={i} className="flex items-center gap-2 bg-white rounded-lg shadow p-2 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  <img
                    src={poap.event?.image_url || '/default-poap.png'}
                    alt={poap.event?.name || 'POAP'}
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="truncate max-w-[9rem]">{poap.event?.name}</span>
                </div>
              ))}
            </div>
            {poapData.length > 4 && (
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => setShowAllPoaps(!showAllPoaps)}
                  className="flex items-center text-xs text-blue-500 hover:underline"
                >
                  {showAllPoaps ? <ChevronUp size={12} /> : <ChevronDown size={12} />} View All
                </button>
              </div>
            )}
          </div>
        )}

        {/* NFTs */}
        {nftsToShow.length > 0 && (
          <div className="mt-8 text-left">
            <h3 className="text-lg font-bold mb-2 text-gray-800 dark:text-white">NFTs (recent)</h3>
            <div className="grid grid-cols-3 gap-2">
              {nftsToShow.map((nft, i) => (
                <img
                  key={i}
                  src={nft.image || nft.image_url || '/nft-placeholder.png'}
                  alt={nft.name || `NFT ${i}`}
                  className="w-full h-24 object-cover rounded-lg shadow"
                />
              ))}
            </div>
          </div>
        )}

        {/* OpenSea link */}
        {address && (
          <div className="mt-4 text-center">
            <a
              href={`https://opensea.io/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
            >
              <ExternalLink size={14} /> View full collection on OpenSea
            </a>
          </div>
        )}

        {/* action buttons */}
        {isOwner && (
          <div className="mt-6 flex justify-center gap-3">
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow"
                >
                  <Save size={16} /> Save
                </button>
                <button
                  onClick={() => { setEditing(false); setEditBio(bio || ensBio); setEditExp(workExperience); }}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 text-sm font-medium rounded-lg shadow"
                >
                  <X size={16} /> Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow"
              >
                <Edit size={16} /> Edit Profile
              </button>
            )}
          </div>
        )}

        {/* save confirmation */}
        {justSaved && (
          <div className="mt-4 flex justify-center items-center text-green-600 text-sm">
            <CheckCircle size={16} className="mr-1" /> Profile saved!
          </div>
        )}
      </div>
    </motion.div>
  );
}
