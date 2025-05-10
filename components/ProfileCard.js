// components/ProfileCard.js

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAccount } from 'wagmi'
import axios from 'axios'
import { motion } from 'framer-motion'
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
  X,
} from 'lucide-react'

/* ------------------------------------------------------------------
   Utility Helpers
-------------------------------------------------------------------*/
function shortenAddress(addr = '') {
  if (!addr) return ''
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function parseDate(d) {
  if (!d) return null
  const p = Date.parse(d.replace(/\//g, '-'))
  return Number.isNaN(p) ? null : new Date(p)
}

function formatRange(s, e, current) {
  if (!s) return ''
  const start = parseDate(s)?.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
  })
  const end = current
    ? 'Present'
    : parseDate(e)?.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
      }) || ''
  return `${start} – ${end}`
}

/**
 * If you see EFP records like "com.twitter" => "somehandle", we map them to icons/prefix:
 */
const EFP_MAP = {
  'com.twitter': {
    label: 'Twitter',
    icon: Twitter,
    prefix: 'https://twitter.com/',
  },
  'com.discord': {
    label: 'Discord',
    icon: UserPlus2, // or a Discord icon
    prefix: null, // no direct link
  },
  'com.github': {
    label: 'GitHub',
    icon: UserPlus2,
    prefix: 'https://github.com/',
  },
  'org.telegram': {
    label: 'Telegram',
    icon: UserPlus2,
    prefix: 'https://t.me/',
  },
  'url': {
    label: 'Website',
    icon: LinkIcon,
    prefix: '',
  },
}

/**
 * Renders a single EFP record as a link or plain text
 */
function RenderEfpSocial({ recordKey, recordValue }) {
  const mapping = EFP_MAP[recordKey] || null
  if (!mapping) {
    // Fallback if unknown
    return (
      <div className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400">
        <LinkIcon size={16} />
        {recordKey}: {recordValue}
      </div>
    )
  }
  const { label, icon: Icon, prefix } = mapping
  if (!prefix) {
    // e.g. Discord might be plain text
    return (
      <div className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400">
        <Icon size={16} />
        {label}: {recordValue}
      </div>
    )
  }
  // Otherwise clickable link
  return (
    <a
      href={prefix + recordValue.replace(/^@/, '')}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
    >
      <Icon size={16} />
      {label}
    </a>
  )
}

/**
 * For DB-based (Twitter, Warpcast, Website) fields
 */
function DbSocialLink({ href, icon: Icon, label }) {
  if (!href) return null
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
    >
      <Icon size={16} />
      {label}
    </a>
  )
}

/**
 * Tag options if you want a dropdown of possible roles
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
  'Founder / Co-Founder',
]

/* ------------------------------------------------------------------
   Main ProfileCard
-------------------------------------------------------------------*/
export default function ProfileCard({ data = {} }) {
  const router = useRouter()
  const { address: connected } = useAccount()

  const {
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
    ownsProfile = false,
    poaps = [],
    nfts = [],
  } = data

  // Are we the owner?
  const isOwner =
    ownsProfile ||
    (connected && address && connected.toLowerCase() === address.toLowerCase())

  // Editing
  const [editing, setEditing] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  // Social fields (DB-based)
  const [editTwitter, setEditTwitter] = useState(twitter)
  const [editWebsite, setEditWebsite] = useState(website)
  const [editWarpcast, setEditWarpcast] = useState(warpcast)

  // Tag + Bio
  const [editTag, setEditTag] = useState(tag)
  const [editBio, setEditBio] = useState(bio || ensBio)

  // Work Experience
  const [editExp, setEditExp] = useState(workExperience)

  // Avatar
  const [uploadedAvatar, setUploadedAvatar] = useState(avatar || '/default-avatar.png')

  // POAP
  const [poapData, setPoapData] = useState(poaps)
  const [showAllPoaps, setShowAllPoaps] = useState(false)

  // EFP
  const [followersCount, setFollowersCount] = useState(null)
  const [efpRecords, setEfpRecords] = useState({})

  // On mount / update, fetch EFP + POAP + fallback avatar if needed
  useEffect(() => {
    if (!address) return

    ;(async () => {
      // 1) EFP
      try {
        const userKey = name?.endsWith('.eth') ? name.toLowerCase() : address
        if (userKey) {
          // EFP ENS details
          const ensRes = await axios.get(
            `https://api.ethfollow.xyz/api/v1/users/${userKey}/ens?cache=fresh`
          )
          const efpEns = ensRes.data?.ens || {}
          const recordsObj = efpEns.records || {}
          setEfpRecords(recordsObj)

          // EFP followers
          const follRes = await axios.get(
            `https://api.ethfollow.xyz/api/v1/users/${userKey}/followers?limit=9999&cache=fresh`
          )
          const arr = follRes.data?.followers || []
          setFollowersCount(arr.length)
        }
      } catch (err) {
        console.warn('EFP fetch error:', err)
        setFollowersCount(0)
      }

      // 2) POAP
      try {
        const r = await axios.get(`https://api.poap.tech/actions/scan/${address}`, {
          headers: { 'X-API-Key': process.env.NEXT_PUBLIC_POAP_API_KEY || 'demo' },
        })
        setPoapData(r.data || [])
      } catch {
        setPoapData([])
      }

      // 3) Fallback avatar from OpenSea if none
      if (!avatar) {
        try {
          const r = await axios.get(`https://api.opensea.io/api/v1/user/${address}`)
          const img = r.data?.account?.profile_img_url || r.data?.profile_img_url
          if (img) setUploadedAvatar(img)
        } catch {
          // ignore
        }
      }
    })()
  }, [address, avatar, name])

  // Handle user uploading an avatar
  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => setUploadedAvatar(reader.result)
    reader.readAsDataURL(file)
  }

  // Save to /api/save-profile
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
          experience: editExp.map((ex) => ({
            ...ex,
            startDate: ex.startDate || '',
            endDate: ex.currentlyWorking ? null : ex.endDate || '',
            currentlyWorking: !!ex.currentlyWorking,
          })),
        }),
      })
      if (!res.ok) throw new Error('Profile save failed')

      setEditing(false)
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 2500)
    } catch (err) {
      console.error('save-profile error', err)
    }
  }

  // Experience updaters
  const updateExp = (i, field, val) => {
    setEditExp((prev) =>
      prev.map((itm, idx) => (idx === i ? { ...itm, [field]: val } : itm))
    )
  }
  const toggleCurrent = (i) => {
    setEditExp((prev) =>
      prev.map((itm, idx) => {
        if (idx === i) {
          return {
            ...itm,
            currentlyWorking: !itm.currentlyWorking,
            endDate: itm.currentlyWorking ? itm.endDate : '',
          }
        }
        return itm
      })
    )
  }
  const addExp = () => {
    setEditExp((prev) => [
      ...prev,
      {
        title: '',
        company: '',
        startDate: '',
        endDate: '',
        location: '',
        description: '',
        currentlyWorking: false,
      },
    ])
  }
  const removeExp = (i) => {
    setEditExp((prev) => prev.filter((_, idx) => idx !== i))
  }

  // Show partial or all POAPs
  const poapsToShow = Array.isArray(poapData)
    ? showAllPoaps
      ? poapData
      : poapData.slice(0, 4)
    : []
  // Show up to 6 NFTs
  const nftsToShow = Array.isArray(nfts) ? nfts.slice(0, 6) : []

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
      {/* Subtle background behind content */}
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
            title="Copy address"
            onClick={() => navigator.clipboard.writeText(address)}
          >
            {shortenAddress(address)}
            <Copy size={12} />
          </p>
        )}

        {/* EFP follower count */}
        {followersCount !== null && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {followersCount} Follower{followersCount === 1 ? '' : 's'}
          </p>
        )}

        {/* If not owner => Message button */}
        {address && !isOwner && (
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
            className="mt-4 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm placeholder-gray-400"
            placeholder="Add a short bio..."
          />
        ) : (
          editBio && (
            <p className="mt-4 text-base text-gray-600 dark:text-gray-300 whitespace-pre-line">
              {editBio}
            </p>
          )
        )}

        {/* Socials & Tag */}
        <div className="mt-6">
          {editing ? (
            // Editing state => DB fields in text inputs
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              <input
                placeholder="Twitter handle"
                value={editTwitter}
                onChange={(e) => setEditTwitter(e.target.value)}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm w-full"
              />
              <input
                placeholder="Warpcast handle"
                value={editWarpcast}
                onChange={(e) => setEditWarpcast(e.target.value)}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm w-full"
              />
              <input
                placeholder="Website"
                value={editWebsite}
                onChange={(e) => setEditWebsite(e.target.value)}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm w-full"
              />
              <select
                value={editTag}
                onChange={(e) => setEditTag(e.target.value)}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm w-full"
              >
                <option value="">Select a Tag</option>
                {TAG_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            // View mode => DB fields plus EFP records
            <div className="flex flex-col gap-3 items-center justify-center">
              {/* DB-based */}
              <div className="flex flex-wrap gap-3 justify-center">
                <DbSocialLink
                  href={
                    editTwitter
                      ? `https://twitter.com/${editTwitter.replace(/^@/, '')}`
                      : null
                  }
                  icon={Twitter}
                  label="Twitter"
                />
                <DbSocialLink
                  href={
                    editWarpcast
                      ? `https://warpcast.com/${editWarpcast.replace(/^@/, '')}`
                      : null
                  }
                  icon={UserPlus2}
                  label="Warpcast"
                />
                <DbSocialLink
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

              {/* EFP-based records */}
              {Object.entries(efpRecords).length > 0 && (
                <div className="flex flex-wrap gap-3 justify-center">
                  {Object.entries(efpRecords).map(([rk, rv]) => {
                    if (!rv || typeof rv !== 'string') return null
                    // skip avatar/description if EFP has them
                    if (rk === 'avatar' || rk === 'description') return null
                    return <RenderEfpSocial key={rk} recordKey={rk} recordValue={rv} />
                  })}
                </div>
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

        {/* OpenSea link if address */}
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

        {/* Edit / Save / Cancel if isOwner */}
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
                    setEditing(false)
                    // revert
                    setEditTwitter(twitter)
                    setEditWebsite(website)
                    setEditWarpcast(warpcast)
                    setEditTag(tag)
                    setEditBio(bio || ensBio)
                    setEditExp(workExperience)
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

        {/* “Profile saved!” confirmation */}
        {justSaved && (
          <div className="mt-4 flex justify-center items-center text-green-600 text-sm">
            <CheckCircle size={16} className="mr-1" /> Profile saved!
          </div>
        )}
      </div>
    </motion.div>
  )
}
