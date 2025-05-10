// components/ENSProfile.js

import { useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'
import { namehash as viemNamehash } from 'viem'
import { createClient } from '@supabase/supabase-js'
import { getEnsData } from '../lib/ensUtils'
import ProfileCard from './ProfileCard'

// If you have a getPOAPs helper, import it. Otherwise comment out.
import { getPOAPs } from '../lib/poapUtils'

/*
  Example: If you want to check ownership via on-chain calls:
*/
const ENS_REGISTRY = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e'
const NAME_WRAPPER = '0x114D4603199df73e7D157787f8778E21fCd13066'
const REGISTRY_ABI = [
  'function owner(bytes32 node) view returns (address)',
  'function getApproved(bytes32 node) view returns (address)',
]
const WRAPPER_ABI = [
  'function ownerOf(uint256 id) view returns (address)',
]

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

/**
 * ENSProfile
 *
 *  Props:
 *   - ensName (e.g. "vitalik.eth")
 *   - forceOwnerView (boolean)
 *   - overrideRecord (object) – optional override from SSR or other logic
 *
 *  This component:
 *   1) Resolves the address (and optional text records) for the ENS name (or fallback to connected user).
 *   2) Fetches POAPs for that address if you want.
 *   3) Fetches stored data from supabase (like custom avatar, warpcast handle, etc.).
 *   4) Optionally checks ownership with on-chain calls if you want to show an "Edit" button only for the owner.
 *   5) Passes everything to <ProfileCard data={...} />
 */
export default function ENSProfile({
  ensName,
  forceOwnerView = false,
  overrideRecord = null
}) {
  const [ensData, setEnsData] = useState({})
  const [poaps, setPoaps] = useState([])
  const [loading, setLoading] = useState(true)

  // From supabase "VCR" table (or any table name), fields such as:
  const [customAvatar, setCustomAvatar] = useState('')
  const [warpcast, setWarpcast] = useState('')
  const [twitter, setTwitter] = useState('')
  const [website, setWebsite] = useState('')
  const [tag, setTag] = useState('')
  const [bio, setBio] = useState('')
  const [workExperience, setWorkExperience] = useState([])
  const [lookingForWork, setLookingForWork] = useState(false)

  const [ownsProfile, setOwnsProfile] = useState(false)

  // If using wagmi’s “useAccount”:
  // import { useAccount } from 'wagmi'
  // const { address: connected } = useAccount()
  // For demonstration, we’ll do a manual local approach
  const connected = null // <--- Or from your context/hook

  /**
   * fetchData – main procedure
   */
  const fetchData = useCallback(async () => {
    setLoading(true)

    try {
      // 1) Attempt to get ENS data
      let finalEns = null
      if (ensName) {
        finalEns = await getEnsData(ensName)  // getEnsData from ensUtils.js
      } else if (connected) {
        finalEns = await getEnsData(connected)
      }

      // fallback if no result
      finalEns = finalEns || { address: connected, name: ensName || null }
      setEnsData(finalEns)

      // 2) Optionally fetch POAPs
      if (finalEns.address) {
        try {
          const poapList = await getPOAPs(finalEns.address)
          setPoaps(poapList || [])
        } catch {
          setPoaps([])
        }
      }

      // 3) Get supabase record, or use overrideRecord if given
      let record = overrideRecord
      if (!record) {
        // e.g. assume your supabase has a 'VCR' table
        const { data, error } = await supabase
          .from('VCR')
          .select('*')
          .eq('ens_name', finalEns.name || ensName || connected)
          .single()

        if (!error && data) {
          record = data
        }
      }

      if (record) {
        if (record.custom_avatar) setCustomAvatar(record.custom_avatar)
        if (record.warpcast) setWarpcast(record.warpcast)
        if (record.twitter) setTwitter(record.twitter)
        if (record.website) setWebsite(record.website)
        if (record.tag) setTag(record.tag)
        if (record.bio) setBio(record.bio)
        if (record.experience) setWorkExperience(record.experience)
        if (typeof record.lookingForWork === 'boolean') {
          setLookingForWork(record.lookingForWork)
        }
      }
    } catch (err) {
      console.error('Failed to load ENSProfile data:', err)
    }

    setLoading(false)
  }, [ensName, connected, overrideRecord])

  /**
   * On mount or whenever ensName/connected changes, fetch data
   */
  useEffect(() => {
    if (ensName || connected) {
      fetchData()
    } else {
      setLoading(false)
    }
  }, [ensName, connected, fetchData])

  /**
   * checkOwnership – optional
   * This is if you want to confirm that “connected” is the true owner
   */
  useEffect(() => {
    if (!connected || !ensName) {
      setOwnsProfile(forceOwnerView) // fallback
      return
    }

    // if forced, skip
    if (forceOwnerView) {
      setOwnsProfile(true)
      return
    }

    const doCheck = async () => {
      try {
        // We'll create a v5 Web3Provider from window.ethereum
        if (typeof window !== 'undefined' && window.ethereum) {
          const provider = new ethers.providers.Web3Provider(window.ethereum)

          const hashedName = viemNamehash(ensName)
          const registry = new ethers.Contract(ENS_REGISTRY, REGISTRY_ABI, provider)
          const wrapper = new ethers.Contract(NAME_WRAPPER, WRAPPER_ABI, provider)

          // fetch registryOwner + manager
          const registryOwner = await registry.owner(hashedName)
          const manager = await registry.getApproved(hashedName)

          let wrapperOwner = null
          try {
            // namehash is BigInt
            const bn = ethers.BigNumber.from(hashedName) // or parse
            wrapperOwner = await wrapper.ownerOf(bn) // or a direct hex
          } catch {}

          // Might also check address record in case
          let ethRecord = null
          try {
            // ethers v5 style
            const resolver = await provider.getResolver(ensName)
            ethRecord = resolver ? await resolver.getAddress() : null
          } catch {}

          const normConnected = connected.toLowerCase()
          const owners = [
            registryOwner,
            manager,
            wrapperOwner,
            ethRecord,
          ]
            .filter(Boolean)
            .map((x) => x.toLowerCase())

          setOwnsProfile(owners.includes(normConnected))
        }
      } catch (err) {
        console.error('❌ ownership check error:', err)
        setOwnsProfile(false)
      }
    }
    doCheck()
  }, [ensName, connected, forceOwnerView])

  // Create the final data object to pass to ProfileCard
  const resolvedAvatar =
    customAvatar || (ensData.avatar && ensData.avatar.startsWith('http')
      ? ensData.avatar
      : '/Avatar.jpg')

  // Render
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <p className="text-gray-500">Loading ENS Profile…</p>
      </div>
    )
  }

  return (
    <div>
      <ProfileCard
        data={{
          // If no name from ENS, fallback to the string ensName or connected address
          name: ensData.name || ensName || connected,
          address: ensData.address || connected,
          avatar: resolvedAvatar,

          // from supabase or DB
          twitter,
          website,
          warpcast,
          tag,
          bio,
          ensBio: ensData.bio || '', // if you store 'bio' from your getEnsData
          workExperience,
          lookingForWork,
          ownsProfile, // pass the boolean
          // If you want to pass any POAPs or NFT array:
          poaps,
          nfts: [], // example or pass real NFTs if you have them
        }}
      />
    </div>
  )
}
