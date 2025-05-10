// pages/preview/[ens].js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAccount } from 'wagmi'
import ENSProfile from '../../components/ENSProfile'
import ResumeModal from '../../components/ResumeModal'

export default function PreviewEnsPage() {
  const router = useRouter()
  const { ens } = router.query

  const { isConnected } = useAccount()

  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [loading, setLoading] = useState(true)

  // For example, if you had some logic to fetch a "Supabase record" for the given `ens`.
  // Combine any such logic from your old `[ensName].js` or `[ens].js` here:
  const [ensRecord, setEnsRecord] = useState(null)

  useEffect(() => {
    if (!router.isReady || !ens) return
    // If you want to fetch some record from supabase:
    // (the code is optional – remove if you don’t need it)
    const fetchEnsRecord = async () => {
      try {
        // For instance:
        // const { data, error } = await supabase.from('VCR').select('*').eq('ens_name', ens).single()
        // if (!error && data) setEnsRecord(data)
      } catch (err) {
        console.error('Error fetching record for ENS:', err)
      }
      setLoading(false)
    }
    fetchEnsRecord()
  }, [ens, router.isReady])

  if (!router.isReady || loading) {
    return <p className="text-center mt-10">Loading ENS profile...</p>
  }

  if (!ens) {
    return <p className="text-center mt-10">No ENS provided.</p>
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white p-6">
      {/* 
         If you want to pass `ensRecord` as override data:
         <ENSProfile ensName={ens} overrideRecord={ensRecord} setShowPreviewModal={setShowPreviewModal} />
      */}
      <ENSProfile ensName={ens} overrideRecord={ensRecord} />

      {/* Example: If you use a ResumeModal somewhere */}
      {showPreviewModal && (
        <ResumeModal
          ensName={ens}
          // pass any other props you need from ensRecord, etc.
          onClose={() => setShowPreviewModal(false)}
        />
      )}
    </div>
  )
}
