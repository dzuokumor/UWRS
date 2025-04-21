import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Map from './ReportMap';
import authService from '../../services/auth';
import api from '../../services/api';

export default function ReportForm() {
  const [formData, setFormData] = useState({
    description: '',
    location: null,
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [apiResponse, setApiResponse] = useState({ success: false, message: '' });
  const fileInputRef = useRef(null);
  const descriptionRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be smaller than 5MB');
        return;
      }
      setImagePreview(URL.createObjectURL(file));
      setFormData({...formData, image: file});
      setError('');
    }
  };

  const handleLocationSelect = (location) => {
    setFormData({...formData, location});
    setError('');
  };

  const handleTakePhoto = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      const modal = document.createElement('div');
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100%';
      modal.style.height = '100%';
      modal.style.backgroundColor = 'rgba(0,0,0,0.9)';
      modal.style.zIndex = '1000';

      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.style.maxHeight = '70vh';

      const captureBtn = document.createElement('button');
      captureBtn.textContent = 'Capture';
      captureBtn.style.padding = '12px 24px';

      const cleanup = () => {
        stream.getTracks().forEach(track => track.stop());
        document.body.removeChild(modal);
      };

      captureBtn.onclick = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
          setImagePreview(URL.createObjectURL(blob));
          setFormData({...formData, image: file});
          cleanup();
        }, 'image/jpeg', 0.9);
      };

      modal.append(video, captureBtn);
      document.body.appendChild(modal);
    } catch (err) {
      setError('Camera access denied. Please check permissions.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setApiResponse({ success: false, message: '' });

    if (!formData.description.trim()) {
      setError('Please add a description');
      return;
    }
    if (!formData.location) {
      setError('Please select a location');
      return;
    }
    if (!formData.image) {
      setError('Please upload an image');
      return;
    }

    setUploading(true);

    try {
      const formPayload = new FormData();
      formPayload.append('description', formData.description);
      formPayload.append('latitude', formData.location.lat);
      formPayload.append('longitude', formData.location.lng);
      formPayload.append('file', formData.image);

      const response = await api.post('/api/submit_report', formPayload);

      setApiResponse({
        success: true,
        message: response.message || 'Report submitted successfully!'
      });

      setFormData({ description: '', location: null, image: null });
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (err) {
      setApiResponse({
        success: false,
        message: err.response?.data?.message || err.message || 'Submission failed'
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Submit Waste Report</h2>

      {apiResponse.success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
          {apiResponse.message}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {apiResponse.message && !apiResponse.success && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {apiResponse.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-gray-700 mb-2">Description*</label>
          <textarea
            ref={descriptionRef}
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg"
            rows={4}
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-2">Location*</label>
          <div className="h-64 rounded-lg overflow-hidden">
            <Map onLocationSelect={handleLocationSelect} />
          </div>
          {formData.location && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: {formData.location.lat.toFixed(6)}, {formData.location.lng.toFixed(6)}
            </p>
          )}
        </div>

        <div>
          <label className="block text-gray-700 mb-2">Image*</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleTakePhoto}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm flex-1"
            >
              Take Photo
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded text-sm flex-1"
            >
              Choose File
            </button>
          </div>
          {imagePreview && (
            <div className="mt-4">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-64 rounded-lg object-cover w-full border border-gray-300"
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={uploading}
          className={`w-full py-3 px-4 rounded-lg font-medium text-white ${
            uploading ? 'bg-gray-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {uploading ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
    </div>
  );
}