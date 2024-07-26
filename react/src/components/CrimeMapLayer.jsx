import React, { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.heat';

const CrimeMapLayer = ({ crimeData }) => {
  const map = useMap();
  const [clusterLayer, setClusterLayer] = useState(null);

  useEffect(() => {
    if (crimeData.length > 0) {
      // Create marker cluster group
      const markers = L.markerClusterGroup({
        disableClusteringAtZoom: 16,
        spiderfyOnMaxZoom: false,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true
      });

      crimeData.forEach(crime => {
        const { latitude, longitude, type, description, timestamp, media_url } = crime;

        // Parse latitude and longitude as floating-point numbers
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);

        if (!isNaN(lat) && !isNaN(lng)) {
          const marker = L.marker([lat, lng]);
          marker.bindPopup(`
            <b>Type:</b> ${type}<br/>
            <b>Description:</b> ${description}<br/>
            <b>Time:</b> ${new Date(timestamp).toLocaleString()}<br/>
            ${media_url ? `<img src="${media_url}" alt="Media" style="max-width: 200px; max-height: 200px;" />` : ''}
          `);
          markers.addLayer(marker);
        }
      });

      // Save layer
      setClusterLayer(markers);

      // Add cluster layer to map
      map.addLayer(markers);
    }

    // Cleanup function
    return () => {
      if (clusterLayer) map.removeLayer(clusterLayer);
    };
  }, [crimeData, map]);

  return null;
};

export default CrimeMapLayer;