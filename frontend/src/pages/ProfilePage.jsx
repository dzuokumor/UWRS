import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function ProfilePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const needsVerification = searchParams.get('verify') === '1'

  useEffect(() => {
    if (needsVerification) {
      console.log('User needs verification')
    }
  }, [needsVerification])

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Profile</h2>
      {needsVerification && (
        <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded-md">
          Please verify your email to access all features
        </div>
      )}
    </div>
  )
}