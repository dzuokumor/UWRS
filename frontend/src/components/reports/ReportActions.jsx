import { claimReport, updateReportStatus } from '@/services/reports.js';

export default function ReportActions({ reportId, isNgoOrGovernment }) {
  const handleClaim = async () => {
    await claimReport(reportId);
  };

  const handleUpdateStatus = async (status) => {
    await updateReportStatus(reportId, status);
  };

  if (!isNgoOrGovernment) return null;

  return (
    <div className="space-x-2 mt-2">
      <button onClick={handleClaim} className="px-4 py-2 bg-blue-600 text-white rounded">
        Claim Report
      </button>
      <button onClick={() => handleUpdateStatus('in progress')} className="px-4 py-2 bg-yellow-600 text-white rounded">
        Mark In Progress
      </button>
      <button onClick={() => handleUpdateStatus('cleaned')} className="px-4 py-2 bg-green-600 text-white rounded">
        Mark Cleaned
      </button>
    </div>
  );
}