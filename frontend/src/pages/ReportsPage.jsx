import ReportForm from '../components/reports/ReportForm';
import ReportList from '../components/reports/ReportList';

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="container mx-auto">
        <ReportForm />
        <ReportList />
      </div>
    </div>
  );
}