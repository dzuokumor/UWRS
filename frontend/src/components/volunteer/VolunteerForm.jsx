import { useState } from 'react';
import { startMovement } from '../../services/volunteers.js';

export default function VolunteerForm({ reportId }) {
  const [neededVolunteers, setNeededVolunteers] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await startMovement(reportId, neededVolunteers, scheduledDate);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <input type="number" value={neededVolunteers} onChange={(e) => setNeededVolunteers(e.target.value)} placeholder="Volunteers Needed" className="w-full p-2 border rounded" required />
      <input type="datetime-local" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="w-full p-2 border rounded" required />
      <button type="submit" className="w-full p-2 bg-orange-600 text-white rounded hover:bg-orange-700">Start Movement</button>
    </form>
  );
}