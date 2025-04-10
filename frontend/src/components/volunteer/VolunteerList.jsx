import { useEffect, useState } from 'react';
import { getActiveMovements } from '../../services/volunteers.js';

export default function VolunteerList() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovements = async () => {
      try {
        const data = await getActiveMovements();
        setMovements(data);
      } catch (error) {
        console.error('Failed to fetch movements:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMovements();
  }, []);

  if (loading) return <div className="text-center p-4">Loading...</div>;

  return (
    <div className="space-y-4 mt-6">
      {movements.length === 0 ? (
        <p className="text-center text-gray-500">No active volunteer movements</p>
      ) : (
        movements.map(movement => (
          <div key={movement.id} className="p-4 border rounded bg-white shadow">
            <h3 className="font-bold">Movement for Report #{movement.report_id}</h3>
            <p>Volunteers Needed: {movement.needed_volunteers}</p>
            <p>Scheduled: {movement.scheduled_date}</p>
          </div>
        ))
      )}
    </div>
  );
}