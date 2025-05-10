// components/ProfileCard.js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'
import { motion } from 'framer-motion'
import {
  Copy,
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
} from 'lucide-react'

/**
 * Shorten a "0x" address, e.g. "0x1234...abcd"
 */
function shortenAddress(addr = '') {
  if (!addr) return ''
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

/**
 * Simple date parser that handles "YYYY-MM-DD" or "MM/DD/YYYY"
 */
function parseDate(d) {
  if (!d) return null
  const p = Date.parse(d.replace(/\//g, '-'))
  return Number.isNaN(p) ? null : new Date(p)
}

/**
 * Format a date range, e.g. "May 2023 – Present" if currentlyWorking is true
 */
function formatRange(s, e, currentlyWorking) {
  if (!s) return ''
  const start = parseDate(s)?.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short'
  })
  const end = currentlyWorking
    ? 'Present'
    : parseDate(e)?.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short'
      }) || ''
  return `${start} – ${end}`
}

export default function ProfileCard({ data = {} }) {
  const {
    // Basic profile fields
    name,
    address,
    avatar,
    twitter = '',
    website = '',
    warpcast = '',
    tag = '',
    bio = '',
    ensBio = '',
    workExperience = [],
    // Additional booleans
    lookingForWork = false,
    ownsProfile = false, // parent sets if user can edit
    // Arrays
    poaps = [],
    nfts = []
  } = data

  const router = useRouter()

  // Is user the owner?
  const isOwner = ownsProfile

  // ------------------- local state for editing -------------------
  const [editing, setEditing] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  const [editLookingForWork, setEditLookingForWork] = useState(lookingForWork)
  const [uploadedAvatar, setUploadedAvatar] = useState(avatar || '/default-avatar.png')

  // Social fields
  const [editTwitter, setEditTwitter] = useState(twitter)
  const [editWebsite, setEditWebsite] = useState(website)
  const [editWarpcast, setEditWarpcast] = useState(warpcast)

  // Tag + Bio
  const [editTag, setEditTag] = useState(tag)
  const [editBio, setEditBio] = useState(bio || ensBio)

  // Experience
  const [editExp, setEditExp] = useState(workExperience)

  // ------------------- POAPs in local state -------------------
  const [poapData, setPoapData] = useState(poaps)
  const [showAllPoaps, setShowAllPoaps] = useState(false)

  // ------------------- effect: fetch POAP + fallback avatar -------------------
  useEffect(() => {
    if (!address) return

    // 1) Attempt POAP fetch from POAP.tech
    axios
      .get(`https://api.poap.tech/actions/scan/${address}`, {
        headers: { 'X-API-Key': process.env.NEXT_PUBLIC_POAP_API_KEY || 'demo' }
      })
      .then((r) => {
        if (Array.isArray(r.data)) {
          setPoapData(r.data)
        } else {
          // If the response is not an array, fallback to empty
          console.warn('POAP fetch: response not an array', r.data)
          setPoapData([])
        }
      })
      .catch((err) => {
        console.error('/api/poap fetch error:', err?.response?.status || err)
        // fallback to empty on error
        setPoapData([])
      })

    // 2) Fallback avatar from OpenSea if none provided
    if (!avatar) {
      axios
        .get(`https://api.opensea.io/api/v1/user/${address}`)
        .then((r) => {
          const img = r.data?.account?.profile_img_url || r.data?.profile_img_url
          if (img) setUploadedAvatar(img)
        })
        .catch(() => {
          // ignore
        })
    }
  }, [address, avatar])

  // ------------------- handlers -------------------
  function handleAvatarUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => setUploadedAvatar(reader.result)
    reader.readAsDataURL(file)
  }

  async function handleSave() {
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
          lookingForWork: editLookingForWork,
          experience: editExp.map((exp) => ({
            ...exp,
            startDate: exp.startDate || '',
            endDate: exp.currentlyWorking ? null : exp.endDate || '',
            currentlyWorking: !!exp.currentlyWorking,
            location: exp.location || '',
            description: exp.description || ''
          }))
        })
      })
      if (!res.ok) {
        throw new Error('Profile save failed')
      }
      // success
      setEditing(false)
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 2500)
    } catch (err) {
      console.error('save-profile error:', err)
    }
  }

  // Work Experience updaters
  function updateExp(i, field, val) {
    setEditExp((prev) =>
      prev.map((ex, idx) => (idx === i ? { ...ex, [field]: val } : ex))
    )
  }
  function toggleCurrent(i) {
    setEditExp((prev) =>
      prev.map((ex, idx) => {
        if (idx === i) {
          return {
            ...ex,
            currentlyWorking: !ex.currentlyWorking,
            endDate: ex.currentlyWorking ? ex.endDate : ''
          }
        }
        return ex
      })
    )
  }
  function addExp() {
    setEditExp((prev) => [
      ...prev,
      {
        title: '',
        company: '',
        startDate: '',
        endDate: '',
        location: '',
        description: '',
        currentlyWorking: false
      }
    ])
  }
  function removeExp(i) {
    setEditExp((prev) => prev.filter((_, idx) => idx !== i))
  }

  // slice POAP + NFT
  const poapsToShow = showAllPoaps ? poapData : poapData.slice(0, 4)
  const nftsToShow = Array.isArray(nfts) ? nfts.slice(0, 6) : []

  // ------------------- render -------------------
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="
        relative w-full max-w-3xl mx-auto 
        rounded-3xl overflow-visible
        shadow-xl border border-gray-100 ring-1 ring-gray-200/70
        bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800
      "
    >
      {/* subtle background effect */}
      <div className="absolute inset-0 opacity-40 animate-pulse-slow pointer-events-none" />

      <div className="relative z-10 p-10 sm:p-12 text-center backdrop-blur-xl">
        {/* Avatar */}
        <div className="relative w-36 h-36 mx-auto -mt-16 mb-4">
          <img
            src={uploadedAvatar}
            alt="avatar"
            className="w-36 h-36 rounded-full border-4 border-white dark:border-gray-700 shadow-md object-cover"
          />
          {isOwner && editing && (
            <label className="absolute bottom-2 right-2 p-1 bg-gray-800/80 rounded-full cursor-pointer hover:bg-gray-700/80 transition-colors">
              <Upload size={14} className="text-white" />
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleAvatarUpload}
              />
            </label>
          )}
        </div>

        {/* Name or fallback */}
        <h2 className="text-4xl font-bold tracking-tight text-gray-800 dark:text-gray-100">
          {name || shortenAddress(address)}
        </h2>

        {/* Address copy */}
        {address && (
          <p
            className="inline-flex items-center gap-1 text-xs sm:text-sm mx-auto text-indigo-600 dark:text-indigo-300 mt-1 cursor-pointer justify-center hover:text-indigo-500 transition-colors"
            title="Copy address"
            onClick={() => navigator.clipboard.writeText(address)}
          >
            {shortenAddress(address)} <Copy size={12} />
          </p>
        )}

        {/* Possibly a message button if not owner */}
        {!isOwner && address && (
          <div className="mt-2">
            <button
              onClick={() => router.push(`/messages?to=${address}`)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
            >
              Message
            </button>
          </div>
        )}

        {/* Bio */}
        {editing ? (
          <textarea
            value={editBio}
            onChange={(e) => setEditBio(e.target.value)}
            rows={4}
            className="mt-4 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm"
            placeholder="Add a short bio..."
          />
        ) : (
          editBio && (
            <p className="mt-4 text-base text-gray-600 dark:text-gray-300 whitespace-pre-line">
              {editBio}
            </p>
          )
        )}

        {/* Social + Tag */}
        <div className="mt-6">
          {editing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              <input
                placeholder="Twitter handle"
                value={editTwitter}
                onChange={(e) => setEditTwitter(e.target.value)}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm"
              />
              <input
                placeholder="Warpcast handle"
                value={editWarpcast}
                onChange={(e) => setEditWarpcast(e.target.value)}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm"
              />
              <input
                placeholder="Website"
                value={editWebsite}
                onChange={(e) => setEditWebsite(e.target.value)}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm"
              />
              <input
                placeholder="Custom Tag"
                value={editTag}
                onChange={(e) => setEditTag(e.target.value)}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm"
              />
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-3">
              {editTwitter && (
                <p className="text-sm text-blue-600 dark:text-blue-400">Twitter: @{editTwitter}</p>
              )}
              {editWarpcast && (
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Warpcast: {editWarpcast}
                </p>
              )}
              {editWebsite && (
                <a
                  href={
                    editWebsite.startsWith('http')
                      ? editWebsite
                      : `https://${editWebsite}`
                  }
                  className="text-sm text-blue-600 dark:text-blue-400 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {editWebsite}
                </a>
              )}
              {editTag && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-800/20 dark:text-indigo-200">
                  {editTag}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Looking for Work */}
        <div className="mt-4">
          {editing ? (
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={editLookingForWork}
                onChange={() => setEditLookingForWork(!editLookingForWork)}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
              Looking for Work
            </label>
          ) : (
            editLookingForWork && (
              <div className="mt-1">
                <span className="inline-block px-2 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded-full">
                  Looking for Work
                </span>
              </div>
            )
          )}
        </div>

        {/* Work Experience */}
        <div className="mt-10 text-left">
          <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-100 flex items-center">
            Experience{' '}
            {editing && (
              <button
                onClick={addExp}
                className="ml-2 inline-flex items-center text-xs text-blue-600 hover:underline"
              >
                <PlusCircle size={14} className="mr-0.5" /> Add
              </button>
            )}
          </h3>

          {editExp.length === 0 && !editing && (
            <p className="text-sm text-gray-500">No experience added yet.</p>
          )}

          {editExp.map((exp, i) => (
            <div key={i} className="mb-6 last:mb-0">
              {editing ? (
                <>
                  <div className="grid sm:grid-cols-2 gap-2">
                    <input
                      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm"
                      placeholder="Job title"
                      value={exp.title}
                      onChange={(e) => updateExp(i, 'title', e.target.value)}
                    />
                    <input
                      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm"
                      placeholder="Company"
                      value={exp.company}
                      onChange={(e) => updateExp(i, 'company', e.target.value)}
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2 mt-3">
                    <input
                      type="date"
                      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm"
                      value={exp.startDate}
                      onChange={(e) => updateExp(i, 'startDate', e.target.value)}
                    />
                    {!exp.currentlyWorking && (
                      <input
                        type="date"
                        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm"
                        value={exp.endDate}
                        onChange={(e) => updateExp(i, 'endDate', e.target.value)}
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-3 text-xs text-gray-600 dark:text-gray-300">
                    <label className="flex items-center gap-1 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={exp.currentlyWorking}
                        onChange={() => toggleCurrent(i)}
                        className="h-4 w-4 text-indigo-600 rounded"
                      />
                      Currently working
                    </label>
                    <button
                      onClick={() => removeExp(i)}
                      className="ml-auto text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Role description"
                    value={exp.description}
                    onChange={(e) => updateExp(i, 'description', e.target.value)}
                    className="w-full mt-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm placeholder-gray-400"
                  />
                </>
              ) : (
                <>
                  <p className="font-semibold text-md text-gray-800 dark:text-gray-100">
                    {exp.title}
                    {exp.company && ` • ${exp.company}`}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {formatRange(exp.startDate, exp.endDate, exp.currentlyWorking)}
                    {exp.location ? ` • ${exp.location}` : ''}
                  </p>
                  {exp.description && (
                    <p className="text-sm mt-2 text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                      {exp.description}
                    </p>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {/* POAPs */}
        {poapsToShow && poapsToShow.length > 0 && (
          <div className="mt-12 text-left">
            <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">
              POAPs
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {poapsToShow.map((poap, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-lg shadow-sm p-2 text-sm text-gray-700 dark:text-gray-300"
                >
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
                  className="flex items-center text-xs text-blue-600 hover:underline transition-colors"
                >
                  {showAllPoaps ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  {showAllPoaps ? 'View Less' : 'View All'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* NFTs */}
        {nftsToShow && nftsToShow.length > 0 && (
          <div className="mt-12 text-left">
            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-100">
              NFTs (recent)
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {nftsToShow.map((nft, idx) => (
                <img
                  key={idx}
                  src={nft.image || nft.image_url || '/nft-placeholder.png'}
                  alt={nft.name || `NFT ${idx}`}
                  className="w-full h-24 object-cover rounded-lg shadow-sm"
                />
              ))}
            </div>
          </div>
        )}

        {/* OpenSea link if address is present */}
        {address && (
          <div className="mt-6 text-center">
            <a
              href={`https://opensea.io/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              <ExternalLink size={14} />
              View full collection on OpenSea
            </a>
          </div>
        )}

        {/* If user is owner => Edit / Save / Cancel */}
        {isOwner && (
          <div className="mt-8 flex justify-center gap-3">
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  className="
                    inline-flex items-center gap-1 px-4 py-2 
                    bg-indigo-600 hover:bg-indigo-700
                    text-white text-sm font-medium 
                    rounded-lg shadow-sm transition-colors
                  "
                >
                  <Save size={16} /> Save
                </button>
                <button
                  onClick={() => {
                    setEditing(false)
                    // revert
                    setEditBio(bio || ensBio)
                    setEditExp(workExperience)
                    setEditTag(tag)
                    setEditTwitter(twitter)
                    setEditWarpcast(warpcast)
                    setEditWebsite(website)
                    setEditLookingForWork(lookingForWork)
                  }}
                  className="
                    inline-flex items-center gap-1 px-4 py-2 
                    bg-gray-300 hover:bg-gray-400 
                    text-gray-800 text-sm font-medium 
                    rounded-lg shadow-sm transition-colors
                  "
                >
                  <X size={16} /> Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="
                  inline-flex items-center gap-1 px-4 py-2 
                  bg-indigo-600 hover:bg-indigo-700 
                  text-white text-sm font-medium 
                  rounded-lg shadow-sm transition-colors
                "
              >
                <Edit size={16} /> Edit Profile
              </button>
            )}
          </div>
        )}

        {/* Save confirmation */}
        {justSaved && (
          <div className="mt-4 flex justify-center items-center text-green-600 text-sm">
            <CheckCircle size={16} className="mr-1" />
            Profile saved!
          </div>
        )}
      </div>
    </motion.div>
  )
}
