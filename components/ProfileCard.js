// components/ProfileCard.js
import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useRouter } from 'next/router'
import axios from 'axios'
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
} from 'lucide-react'
import { motion } from 'framer-motion'

/* ------------------------------------------------------------------
   Utility Helpers
-------------------------------------------------------------------*/

/** 
 * Shorten "0xAddress" to e.g. "0x1234...abcd" 
 */
function shortenAddress(addr = '') {
  if (!addr) return ''
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

/**
 * Parse date from "YYYY-MM-DD" or "MM/DD/YYYY"
 */
function parseDate(d) {
  if (!d) return null
  const p = Date.parse(d.replace(/\//g, '-'))
  return Number.isNaN(p) ? null : new Date(p)
}

/**
 * Format "May 2023 – Present" if `currentlyWorking` is true
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

/* 
  Possible Tag options, used if you're letting user pick from a dropdown:
*/
const TAG_OPTIONS = [
  'Front-End Developer',
  'Back-End Developer',
  'Full-Stack Engineer',
  'Smart Contract Engineer',
  'Solidity Auditor',
  'Protocol Researcher',
  'DevOps & Infra',
  'Security Engineer',
  'Product Manager',
  'Designer / UX',
  'Technical Writer',
  'Growth Lead',
  'Marketing Manager',
  'Social Media Strategist',
  'Community Manager',
  'Developer Relations',
  'DAO Governor',
  'Governance Analyst',
  'Tokenomics Designer',
  'Partnerships Lead',
  'Business Development',
  'Support',
  'Discord',
  'Memecoins',
  'Trader',
  'Ecosystem',
  'Legal',
  'Protocol',
  'CEO',
  'COO',
  'CFO',
  'Founder / Co-Founder'
]

/** 
 * Simple sub-component for a clickable link with an icon 
 */
function SocialLink({ href, icon: Icon, label }) {
  if (!href) return null
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline transition-colors"
    >
      <Icon size={16} />
      {label}
    </a>
  )
}

/* ------------------------------------------------------------------
   Main ProfileCard
-------------------------------------------------------------------*/
export default function ProfileCard({ data = {} }) {
  const router = useRouter()
  const { address: connectedAddress } = useAccount()

  // Destructure initial data from parent
  const {
    // basic fields
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
    ownsProfile = false, // true if we can edit
    // arrays
    poaps = [],
    nfts = [],
    // EFP extras might come in, but we'll also fetch them ourselves
  } = data

  // Check if viewer can edit
  const isOwner =
    ownsProfile ||
    (connectedAddress &&
      address &&
      connectedAddress.toLowerCase() === address.toLowerCase())

  // ---------- Local state for editing ------------
  const [editing, setEditing] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  // Social
  const [editTwitter, setEditTwitter] = useState(twitter)
  const [editWebsite, setEditWebsite] = useState(website)
  const [editWarpcast, setEditWarpcast] = useState(warpcast)

  // Tag + bio
  const [editTag, setEditTag] = useState(tag)
  const [editBio, setEditBio] = useState(bio || ensBio)

  // Work experience
  const [editExp, setEditExp] = useState(workExperience)

  // Avatar
  const [uploadedAvatar, setUploadedAvatar] = useState(avatar || '/default-avatar.png')

  // POAP data
  const [poapData, setPoapData] = useState(poaps)
  const [showAllPoaps, setShowAllPoaps] = useState(false)

  // NFT data
  // We'll just slice what's given in `nfts`
  const nftsToShow = Array.isArray(nfts) ? nfts.slice(0, 6) : []

  // ---------- EFP data (followers & socials) ------------
  const [followersCount, setFollowersCount] = useState(null)
  // If you wanted to store EFP "records" for e.g. Discord, Telegram, etc.
  // you can do so here. If not needed, remove it:
  const [efpRecords, setEfpRecords] = useState({})

  /* ----------------------------------------------------------------
     Effects: fetch EFP + POAP + fallback avatar
  ----------------------------------------------------------------*/
  useEffect(() => {
    if (!address) return

    // 1) fetch EFP details & followers
    ;(async () => {
      try {
        // EFP “/details” for social + “/followers” for follower array
        const userKey = name?.endsWith('.eth') ? name.toLowerCase() : address
        if (!userKey) return

        // EFP details => social records
        const detailsRes = await axios.get(
          `https://api.ethfollow.xyz/api/v1/users/${userKey}/ens?cache=fresh`
        )
        // shape: { ens: { name, address, avatar, records: {...} } }
        const ensData = detailsRes.data?.ens || {}
        const recs = ensData.records || {}
        // you can parse recs for e.g. 'com.discord' => 'discord: handle', etc.
        setEfpRecords(recs)

        // EFP followers => we just want .length
        const follRes = await axios.get(
          `https://api.ethfollow.xyz/api/v1/users/${userKey}/followers?limit=9999&cache=fresh`
        )
        const arr = follRes.data?.followers || []
        setFollowersCount(arr.length)
      } catch (err) {
        console.warn('EFP fetch error:', err)
        setFollowersCount(0)
      }
    })()

    // 2) fetch POAP data from POAP.tech
    ;(async () => {
      try {
        const poapResp = await axios.get(`https://api.poap.tech/actions/scan/${address}`, {
          headers: { 'X-API-Key': process.env.NEXT_PUBLIC_POAP_API_KEY || 'demo' }
        })
        if (Array.isArray(poapResp.data)) {
          setPoapData(poapResp.data)
        } else {
          setPoapData([])
        }
      } catch (err) {
        console.error('POAP fetch error', err)
        setPoapData([])
      }
    })()

    // 3) fallback avatar from OpenSea if no custom avatar
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
  }, [address, name, avatar])

  // ---------- handle avatar upload ------------
  function handleAvatarUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => setUploadedAvatar(reader.result)
    reader.readAsDataURL(file)
  }

  // ---------- handle Save ------------
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
          // map experience properly
          experience: editExp.map((ex) => ({
            ...ex,
            startDate: ex.startDate || '',
            endDate: ex.currentlyWorking ? null : ex.endDate || '',
            currentlyWorking: !!ex.currentlyWorking
          }))
        })
      })
      if (!res.ok) {
        const msg = (await res.json()).error || 'Unknown error'
        throw new Error(msg)
      }
      // success
      setEditing(false)
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 2500)
    } catch (err) {
      console.error('save-profile error', err)
    }
  }

  // ---------- experience updaters ------------
  function updateExp(i, field, val) {
    setEditExp((prev) =>
      prev.map((item, idx) => (idx === i ? { ...item, [field]: val } : item))
    )
  }
  function toggleCurrent(i) {
    setEditExp((prev) =>
      prev.map((item, idx) => {
        if (idx === i) {
          return {
            ...item,
            currentlyWorking: !item.currentlyWorking,
            endDate: item.currentlyWorking ? item.endDate : ''
          }
        }
        return item
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

  // ---------- derived data ------------
  // POAPs
  const poapsToShow = Array.isArray(poapData)
    ? showAllPoaps
      ? poapData
      : poapData.slice(0, 4)
    : []

  // ---------- rendering ------------
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
      {/* Subtle background */}
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
              <input type="file" accept="image/*" hidden onChange={handleAvatarUpload} />
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
            onClick={() => navigator.clipboard.writeText(address)}
            title="Copy address"
          >
            {shortenAddress(address)}
            <Copy size={12} />
          </p>
        )}

        {/* Show EFP follower count if we have it */}
        {followersCount !== null && followersCount >= 0 && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {followersCount} Follower{followersCount === 1 ? '' : 's'}
          </p>
        )}

        {/* Possibly a "Message" button if not owner */}
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
            className="mt-4 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm placeholder-gray-400"
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
            // editing mode => inputs
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              <input
                placeholder="Twitter handle"
                value={editTwitter}
                onChange={(e) => setEditTwitter(e.target.value)}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm w-full placeholder-gray-400"
              />
              <input
                placeholder="Warpcast handle"
                value={editWarpcast}
                onChange={(e) => setEditWarpcast(e.target.value)}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm w-full placeholder-gray-400"
              />
              <input
                placeholder="Website"
                value={editWebsite}
                onChange={(e) => setEditWebsite(e.target.value)}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm w-full placeholder-gray-400"
              />
              <select
                value={editTag}
                onChange={(e) => setEditTag(e.target.value)}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm w-full"
              >
                <option value="">Select a Tag</option>
                {TAG_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            // view mode => clickable or text
            <div className="flex flex-wrap justify-center gap-3">
              <SocialLink
                href={
                  editTwitter
                    ? `https://twitter.com/${editTwitter.replace(/^@/, '')}`
                    : null
                }
                icon={Twitter}
                label="Twitter"
              />
              <SocialLink
                href={
                  editWarpcast
                    ? `https://warpcast.com/${editWarpcast.replace(/^@/, '')}`
                    : null
                }
                icon={UserPlus2}
                label="Warpcast"
              />
              <SocialLink
                href={
                  editWebsite
                    ? editWebsite.startsWith('http')
                      ? editWebsite
                      : `https://${editWebsite}`
                    : null
                }
                icon={LinkIcon}
                label="Website"
              />
              {editTag && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-800/20 dark:text-indigo-200">
                  {editTag}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Work Experience */}
        <div className="mt-10 text-left">
          <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-100 flex items-center">
            Experience{' '}
            {editing && (
              <button
                onClick={addExp}
                className="ml-2 inline-flex items-center text-xs text-blue-600 hover:underline transition-colors"
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
                      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm placeholder-gray-400"
                      placeholder="Job title"
                      value={exp.title}
                      onChange={(e) => updateExp(i, 'title', e.target.value)}
                    />
                    <input
                      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm placeholder-gray-400"
                      placeholder="Company"
                      value={exp.company}
                      onChange={(e) => updateExp(i, 'company', e.target.value)}
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2 mt-3">
                    <input
                      type="date"
                      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm placeholder-gray-400"
                      value={exp.startDate}
                      onChange={(e) => updateExp(i, 'startDate', e.target.value)}
                    />
                    {!exp.currentlyWorking && (
                      <input
                        type="date"
                        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm placeholder-gray-400"
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
                    {exp.location && ` • ${exp.location}`}
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
        {poapsToShow.length > 0 && (
          <div className="mt-12 text-left">
            <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">
              POAPs
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {poapsToShow.map((poap, i) => (
                <div
                  key={i}
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
        {nftsToShow.length > 0 && (
          <div className="mt-12 text-left">
            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-100">
              NFTs (recent)
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {nftsToShow.map((nft, i) => (
                <img
                  key={i}
                  src={nft.image || nft.image_url || '/nft-placeholder.png'}
                  alt={nft.name || `NFT ${i}`}
                  className="w-full h-24 object-cover rounded-lg shadow-sm"
                />
              ))}
            </div>
          </div>
        )}

        {/* EFP-based follower count is rendered above by followersCount check. */}

        {/* Link to OpenSea if address present */}
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

        {/* If user is owner => Edit/Save/Cancel */}
        {isOwner && (
          <div className="mt-8 flex justify-center gap-3">
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
                >
                  <Save size={16} /> Save
                </button>
                <button
                  onClick={() => {
                    // revert changes
                    setEditing(false)
                    setEditBio(bio || ensBio)
                    setEditExp(workExperience)
                    setEditTag(tag)
                    setEditTwitter(twitter)
                    setEditWarpcast(warpcast)
                    setEditWebsite(website)
                  }}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 text-sm font-medium rounded-lg shadow-sm transition-colors"
                >
                  <X size={16} /> Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
              >
                <Edit size={16} /> Edit Profile
              </button>
            )}
          </div>
        )}

        {/* Save confirmation */}
        {justSaved && (
          <div className="mt-4 flex justify-center items-center text-green-600 text-sm">
            <CheckCircle size={16} className="mr-1" /> Profile saved!
          </div>
        )}
      </div>
    </motion.div>
  )
}
