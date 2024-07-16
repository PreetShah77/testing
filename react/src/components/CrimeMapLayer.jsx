import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.heat';

const CrimeMapLayer = ({ crimeData }) => {
  const map = useMap();

  useEffect(() => {
    if (crimeData.length > 0) {
      const markers = L.markerClusterGroup();
      const heatArray = [];

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

          heatArray.push([lat, lng, 1]); // The third value is the intensity
        }
      });

      map.addLayer(markers);
      L.heatLayer(heatArray, { radius: 25 }).addTo(map);
    }
  }, [crimeData, map]);

  return null;
};

export default CrimeMapLayer;
