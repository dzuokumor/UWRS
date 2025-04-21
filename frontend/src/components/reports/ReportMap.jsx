import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-geosearch/dist/geosearch.css';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LocationMarker = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position && map) {
      map.setView(position, map.getZoom(), { animate: false });
    }
  }, [position, map]);

  return position ? (
    <Marker position={position}>
      <Popup>Selected Location</Popup>
    </Marker>
  ) : null;
};

const SearchBar = ({ map }) => {
  useEffect(() => {
    const provider = new OpenStreetMapProvider();
    const searchControl = new GeoSearchControl({
      provider,
      style: 'bar',
      showMarker: true,
      autoClose: true,
      retainZoomLevel: false,
      animateZoom: false,
    });

    map.addControl(searchControl);
    return () => map.removeControl(searchControl);
  }, [map]);

  return null;
};

export default function ReportMap({ onLocationSelect }) {
  const [map, setMap] = useState(null);
  const [position, setPosition] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [error, setError] = useState(null);
  const [manualCoords, setManualCoords] = useState({ lat: '', lng: '' });
  const [showManualInput, setShowManualInput] = useState(false);

  // Get user's current location
  useEffect(() => {
    let mounted = true;

    const getLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (mounted) {
              const loc = {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude
              };
              setCurrentLocation(loc);
              setPosition(loc);
              onLocationSelect(loc);
              if (map) map.setView(loc, 15, { animate: false });
            }
          },
          () => {
            if (mounted && !position) {
              setError('Enable location services or select manually');
              const defaultLoc = { lat: 0, lng: 0 };
              setPosition(defaultLoc);
              onLocationSelect(defaultLoc);
              if (map) map.setView(defaultLoc, 2, { animate: false });
            }
          },
          { timeout: 10000 }
        );
      } else if (!position) {
        setError('Geolocation not supported');
        const defaultLoc = { lat: 0, lng: 0 };
        setPosition(defaultLoc);
        onLocationSelect(defaultLoc);
        if (map) map.setView(defaultLoc, 2, { animate: false });
      }
    };

    getLocation();
    return () => { mounted = false; };
  }, [map, onLocationSelect, position]);

  const handleMapClick = useCallback((e) => {
    const loc = { lat: e.latlng.lat, lng: e.latlng.lng };
    setPosition(loc);
    onLocationSelect(loc);
    setShowManualInput(false);
  }, [onLocationSelect]);

  const useCurrentLocation = useCallback(() => {
    if (currentLocation) {
      setPosition(currentLocation);
      onLocationSelect(currentLocation);
      map?.setView(currentLocation, 15, { animate: false });
    }
  }, [currentLocation, map, onLocationSelect]);

  const handleManualCoordsSubmit = (e) => {
    e.preventDefault();
    try {
      const lat = parseFloat(manualCoords.lat);
      const lng = parseFloat(manualCoords.lng);

      if (isNaN(lat) || isNaN(lng)) {
        throw new Error('Invalid coordinates');
      }

      const loc = { lat, lng };
      setPosition(loc);
      onLocationSelect(loc);
      map?.setView(loc, 15, { animate: false });
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={useCurrentLocation}
          className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded text-sm"
          disabled={!currentLocation}
        >
          Use Current Location
        </button>

        <button
          onClick={() => setShowManualInput(!showManualInput)}
          className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded text-sm"
        >
          {showManualInput ? 'Hide' : 'Enter Coordinates'}
        </button>

        <a
          href="https://www.gps-coordinates.net/my-location"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded text-sm"
        >
          Find Coordinates
        </a>
      </div>

      {showManualInput && (
        <form onSubmit={handleManualCoordsSubmit} className="flex flex-col sm:flex-row gap-2 mt-4 mb-6">
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              placeholder="Latitude"
              value={manualCoords.lat}
              onChange={(e) => setManualCoords({...manualCoords, lat: e.target.value})}
              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Longitude"
              value={manualCoords.lng}
              onChange={(e) => setManualCoords({...manualCoords, lng: e.target.value})}
              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm"
          >
            Apply
          </button>
        </form>
      )}

      {error && !position && (
        <div className="p-2 bg-red-100 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      <div className="h-64 rounded-lg overflow-hidden border border-gray-300">
        <MapContainer
          center={position || [0, 0]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          whenCreated={setMap}
          zoomControl={true}
          doubleClickZoom={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {map && <SearchBar map={map} />}
          <ClickHandler onMapClick={handleMapClick} />
          {position && <LocationMarker position={position} />}
        </MapContainer>
      </div>

      {position && (
        <div className="text-sm text-gray-700 p-2 bg-gray-100 rounded">
          Selected: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
        </div>
      )}
    </div>
  );
}

function ClickHandler({ onMapClick }) {
  const map = useMap();
  useEffect(() => {
    const handleClick = (e) => onMapClick(e);
    map.on('click', handleClick);
    return () => map.off('click', handleClick);
  }, [map, onMapClick]);
  return null;
}