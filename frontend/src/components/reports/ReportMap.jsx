import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getReports } from '../../services/reports';
import {useEffect, useState} from "react";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

export default function ReportMap() {
  const [reports, setReports] = useState([]);
  const [center, setCenter] = useState([0, 0]);

  useEffect(() => {
    const fetchReports = async () => {
      const data = await getReports();
      setReports(data);
      if (data.length > 0) {
        setCenter([data[0].latitude, data[0].longitude]);
      }
    };
    fetchReports();
  }, []);

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: '400px', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {reports.map((report) => (
        <Marker key={report.id} position={[report.latitude, report.longitude]}>
          <Popup>
            <div>
              <h3 className="font-bold">Report #{report.id}</h3>
              <p>{report.description}</p>
              <p>Status: {report.status}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}