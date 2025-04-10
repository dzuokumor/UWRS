import VolunteerList from '../components/volunteer/VolunteerList';
import VolunteerForm from '../components/volunteer/VolunteerForm';

export default function VolunteerPage() {
  return (
    <div className="container mx-auto p-4">
      <VolunteerForm reportId={1} /> {/* Replace with dynamic reportId */}
      <VolunteerList />
    </div>
  );
}