// components/ENSProfile.js

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { getEnsData } from '../lib/ensUtils'
import { getPOAPs } from '../lib/poapUtils'
import ProfileCard from './ProfileCard'
import Head from 'next/head'
import { useAccount } from 'wagmi'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

/**
 * ENSProfile
 *  - Takes an `ensName` prop (or fallback).
 *  - Grabs data from Supabase and merges w/ onchain info (POAPs, etc.)
 *  - Renders a <ProfileCard /> with the combined data.
 */
export default function ENSProfile({ ensName = '', overrideRecord = null }) {
  const [ensData, setEnsData] = useState({})
  const [poaps, setPoaps] = useState([])
  const [ownsProfile, setOwnsProfile] = useState(false)
  const [customAvatar, setCustomAvatar] = useState('')
  const [twitter, setTwitter] = useState('')
  const [website, setWebsite] = useState('')
  const [warpcast, setWarpcast] = useState('')
  const [tag, setTag] = useState('')
  const [bio, setBio] = useState('')
  const [workExperience, setWorkExperience] = useState([])
  const [loading, setLoading] = useState(true)

  // Connected wallet address from wagmi
  const { address: connected } = useAccount()

  /**
   * fetchData => primary function to:
   *   - getEnsData(ensName) or fallback
   *   - fetch POAPs
   *   - fetch supabase row (unless overrideRecord is given)
   */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)

      // 1) Onchain data / fallback
      let resolvedEns = null
      if (ensName) {
        resolvedEns = await getEnsData(ensName)
      }
      // If that returns nothing, fallback to a shape w/ address if possible
      const chainData = resolvedEns || {}

      // 2) POAPs
      let fetchedPoaps = []
      if (chainData.address) {
        fetchedPoaps = await getPOAPs(chainData.name || chainData.address)
      }
      setPoaps(fetchedPoaps)

      // 3) Merge with Supabase record
      let record = overrideRecord
      if (!record) {
        // Attempt fetch from supabase if we have an ensName
        if (chainData.name || ensName) {
          const supaName = chainData.name || ensName
          const { data: row, error } = await supabase
            .from('VCR')
            .select('*')
            .eq('ens_name', supaName)
            .single()

          if (!error && row) {
            record = row
          }
        }
      }

      // 4) Populate local states
      if (record) {
        if (record.custom_avatar) setCustomAvatar(record.custom_avatar)
        if (record.twitter) setTwitter(record.twitter)
        if (record.website) setWebsite(record.website)
        if (record.warpcast) setWarpcast(record.warpcast)
        if (record.tag) setTag(record.tag)
        if (record.bio) setBio(record.bio)
        if (record.experience) setWorkExperience(record.experience)
      }

      // Store the “ensData” structure for fallback avatar, etc.
      setEnsData(chainData)
    } catch (err) {
      console.error('❌ ENSProfile fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [ensName, overrideRecord])

  // On mount or if ensName changes
  useEffect(() => {
    if (!ensName) {
      setLoading(false)
      return
    }
    fetchData()
  }, [ensName, fetchData])

  /**
   * If you want to do ownership check, you can do it here
   * (but in v5 you'd rely on a standard provider, etc.)
   * For now we skip or do a no-op
   */
  useEffect(() => {
    // Basic example: if connected address matches the chainData address => ownsProfile = true
    // (But you'd want to actually do an on-chain read of the .eth name, etc.)
  }, [connected])

  if (!ensName) {
    return (
      <div className="text-center mt-10">
        <p>No ENS name provided.</p>
      </div>
    )
  }

  // Build final avatar
  const resolvedAvatar =
    customAvatar ||
    (ensData.avatar && ensData.avatar.startsWith('http')
      ? ensData.avatar
      : '/Avatar.jpg')

  return (
    <>
      <Head>
        <title>ENS Profile - {ensName}</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-[#F9FAFB] via-[#F3E8FF] to-[#74E0FF] p-4">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <p className="text-[#6B7280]">Loading ENS profile...</p>
          </div>
        ) : (
          <div className="flex justify-center">
            <ProfileCard
              data={{
                name: ensData.name || ensName,
                address: ensData.address || '',
                avatar: resolvedAvatar,
                twitter,
                website,
                warpcast,
                tag: tag || 'Active Builder',
                poaps,
                ownsProfile,
                bio,
                ensBio: ensData.bio || '', // if getEnsData returns a 'bio' field
                workExperience,
              }}
            />
          </div>
        )}
      </div>
    </>
  )
}
