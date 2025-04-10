import { useEffect, useState } from 'react';
import { getReports } from '../../services/reports';

export default function ReportList() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const fetchReports = async () => {
      const res = await getReports();
      setReports(res.data);
    };
    fetchReports();
  }, []);

  return (
    <div className="space-y-4 mt-10">
      {reports.map((report) => (
        <div key={report.id} className="p-4 border rounded bg-white shadow">
          <p><strong>Location:</strong> {report.latitude}, {report.longitude}</p>
          <p><strong>Status:</strong> {report.status}</p>
          <p>{report.description}</p>
        </div>
      ))}
    </div>
  );
}