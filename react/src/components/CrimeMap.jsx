import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import * as d3 from 'd3';
import CrimeMapLayer from './CrimeMapLayer'; // Assuming you have the CrimeMapLayer in a separate file

const CrimeMap = () => {
  const [crimeData, setCrimeData] = useState([]);

  useEffect(() => {
    // Fetch the CSV data from the public directory
    d3.csv('/crime_reports.csv').then(data => {
      // Convert timestamp to Date object for correct display and parse latitude/longitude
      const formattedData = data.map(crime => ({
        ...crime,
        timestamp: new Date(crime.timestamp),
        latitude: parseFloat(crime.latitude),
        longitude: parseFloat(crime.longitude)
      }));
      setCrimeData(formattedData);
    }).catch(error => {
      console.error('Error fetching or parsing data:', error);
    });
  }, []);

  return (
    <MapContainer center={[23.0, 72.6]} zoom={13} style={{ height: '600px', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      <CrimeMapLayer crimeData={crimeData} />
    </MapContainer>
  );
};

export default CrimeMap;
