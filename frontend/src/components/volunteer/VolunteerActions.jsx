import { joinMovement, blockMovement } from '@/services/volunteers.js'

export default function VolunteerActions({ reportId, userRole }) {
  const handleJoin = async () => {
    await joinMovement(reportId)
  }

  const handleBlock = async () => {
    await blockMovement(reportId)
  }

  return (
    <div className="mt-4 space-x-2">
      <button
        onClick={handleJoin}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Join Movement
      </button>
      {userRole === 'Government' && (
        <button
          onClick={handleBlock}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Block Movement
        </button>
      )}
    </div>
  )
}