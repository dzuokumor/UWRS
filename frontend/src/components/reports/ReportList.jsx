import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/auth';
import ReportActions from './ReportActions';

export default function ReportList() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
    } else {
      fetchReports();
    }
  }, [navigate]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await authService.getReports();
      console.log('Raw reports data: ', data);

      if (Array.isArray(data)) {
        setReports(data.filter(report => report.status === 'pending'));
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimSuccess = (reportId) => {
    setReports(reports.filter(report => report.id !== reportId));
  };

  if (loading) return <div className="p-6">Loading reports...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (reports.length === 0) return <div className="p-6">No pending reports available</div>;

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <div key={report.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            {report.image_url && (
              <div className="h-48 overflow-hidden">
                <img
                  src={report.image_url}
                  alt={`Report image ${report.id}`}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-4">
              <button
                onClick={() => setSelectedReport(report)}
                className="text-blue-600 underline mb-3"
              >
                View Details
              </button>
              <ReportActions
                report={report}
                onClaimSuccess={() => handleClaimSuccess(report.id)}
              />
            </div>
          </div>
        ))}
      </div>

      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">Report Details</h3>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {selectedReport.image_url && (
                <div className="h-64 overflow-hidden rounded-lg">
                  <img
                    src={selectedReport.image_url}
                    alt={`Report image ${selectedReport.id}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div>
                <h4 className="font-semibold">Description:</h4>
                <p>{selectedReport.description}</p>
              </div>

              <div>
                <h4 className="font-semibold">Location:</h4>
                <p>Lat: {selectedReport.latitude}, Lng: {selectedReport.longitude}</p>
              </div>

              <div>
                <h4 className="font-semibold">Reported At:</h4>
                <p>{new Date(selectedReport.created_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
