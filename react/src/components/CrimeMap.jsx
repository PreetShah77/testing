import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import 'leaflet.heat';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import CrimeMapLayer from './CrimeMapLayer';

// Setting up the marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const CrimeMap = () => {
  const [crimes, setCrimes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCrimes = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('http://localhost:5050/api/crimes_for_map');
        setCrimes(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching crime data:', error);
        setError('Failed to load crime data. Please try again later.');
        setIsLoading(false);
      }
    };

    fetchCrimes();
  }, []);

  if (isLoading) return <div>Loading crime data...</div>;
  if (error) return <div>{error}</div>;

  return (
    <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100vh', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <CrimeMapLayer crimeData={crimes} />
    </MapContainer>
  );
};

export default CrimeMap;