import { useState } from 'react'
import { submitReport } from '@/services/reports.js'

export default function ReportForm() {
  const [formData, setFormData] = useState({
    latitude: '',
    longitude: '',
    description: '',
    image: null
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    const data = new FormData()
    data.append('latitude', formData.latitude)
    data.append('longitude', formData.longitude)
    data.append('description', formData.description)
    if (formData.image) data.append('image', formData.image)

    await submitReport(data)
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-8 p-6 bg-white rounded shadow">
      <div className="mb-4">
        <input
          type="number"
          step="any"
          value={formData.latitude}
          onChange={(e) => setFormData({...formData, latitude: e.target.value})}
          className="w-full p-2 border rounded"
          placeholder="Latitude"
          required
        />
      </div>
      <div className="mb-4">
        <input
          type="number"
          step="any"
          value={formData.longitude}
          onChange={(e) => setFormData({...formData, longitude: e.target.value})}
          className="w-full p-2 border rounded"
          placeholder="Longitude"
          required
        />
      </div>
      <div className="mb-4">
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          className="w-full p-2 border rounded"
          placeholder="Description"
          required
        />
      </div>
      <div className="mb-4">
        <input
          type="file"
          onChange={(e) => setFormData({...formData, image: e.target.files[0]})}
          className="w-full p-2 border rounded"
        />
      </div>
      <button type="submit" className="w-full p-2 bg-green-600 text-white rounded hover:bg-green-700">
        Submit Report
      </button>
    </form>
  )
}