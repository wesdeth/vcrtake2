// pages/profile.js
import { useEffect, useState } from 'react'
import Head from 'next/head'
import { useAccount } from 'wagmi'
import ENSProfile from '../components/ENSProfile'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function ProfilePage() {
  const { address, isConnected } = useAccount()
  const [ensName, setEnsName] = useState('')
  const [loading, setLoading] = useState(true)
  const [ensRecord, setEnsRecord] = useState(null)

  /**
   * 1) Attempt to resolve the wallet address → an ENS name (via ensideas)
   */
  useEffect(() => {
    const resolveENS = async () => {
      if (!address) {
        setLoading(false)
        return
      }
      try {
        // “ensideas” endpoint: "https://mainnet.ensideas.com/ens/resolve/:address"
        const res = await fetch(`https://mainnet.ensideas.com/ens/resolve/${address}`)
        const data = await res.json()
        if (data?.name) {
          setEnsName(data.name)
        } else {
          // fallback to just address if not found
          setEnsName(address)
        }
      } catch (err) {
        console.error('❌ Failed to resolve ENS name:', err)
        setEnsName(address)
      }
    }
    resolveENS()
  }, [address])

  /**
   * 2) Once we have an ensName, fetch a row from supabase’s “VCR” table
   */
  useEffect(() => {
    const fetchProfile = async () => {
      if (!ensName) {
        setLoading(false)
        return
      }
      try {
        const { data, error } = await supabase
          .from('VCR')
          .select('*')
          .eq('ens_name', ensName)
          .single()

        if (!error && data) {
          setEnsRecord(data)
        }
      } catch (err) {
        console.error('❌ Supabase fetch error:', err)
      }
      setLoading(false)
    }
    fetchProfile()
  }, [ensName])

  return (
    <>
      <Head>
        <title>Your Profile – Verified Chain Resume</title>
      </Head>

      <div className="min-h-screen pt-20 px-4 bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-white font-calsans">
        <div className="max-w-3xl mx-auto text-center mt-16">
          {/* Display states depending on wallet & loading */}
          {!isConnected ? (
            <p className="text-lg text-gray-500 dark:text-gray-400">
              Connect your wallet to view &amp; edit your profile.
            </p>
          ) : loading ? (
            <p className="text-lg text-gray-500 dark:text-gray-400">
              Loading your profile…
            </p>
          ) : (
            <ENSProfile
              ensName={ensName}
              overrideRecord={ensRecord}
              // forceOwnerView = { ... }  // if you want to forcibly allow editing
            />
          )}
        </div>
      </div>
    </>
  )
}
