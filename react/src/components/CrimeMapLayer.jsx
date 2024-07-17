import React, { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.heat';

const CrimeMapLayer = ({ crimeData }) => {
  const map = useMap();
  const [clusterLayer, setClusterLayer] = useState(null);
  const [heatLayer, setHeatLayer] = useState(null);
  const [viewMode, setViewMode] = useState('cluster'); // 'cluster' or 'heat'

  useEffect(() => {
    if (crimeData.length > 0) {
      // Create marker cluster group
      const markers = L.markerClusterGroup({
        disableClusteringAtZoom: 16,
        spiderfyOnMaxZoom: false,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true
      });

      // Create heat layer array
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

          // Add point to heat array (you can adjust intensity based on crime type if needed)
          heatArray.push([lat, lng, 1]);
        }
      });

      // Create heat layer
      const heat = L.heatLayer(heatArray, { 
        radius: 25, 
        blur: 15, 
        maxZoom: 17,
        max: 1.0,
        gradient: { 0.4: 'blue', 0.65: 'lime', 1: 'red' }
      });

      // Save layers
      setClusterLayer(markers);
      setHeatLayer(heat);

      // Initial view
      map.addLayer(markers);
    }

    // Cleanup function
    return () => {
      if (clusterLayer) map.removeLayer(clusterLayer);
      if (heatLayer) map.removeLayer(heatLayer);
    };
  }, [crimeData, map]);

  // Toggle between cluster and heat view
  useEffect(() => {
    if (clusterLayer && heatLayer) {
      if (viewMode === 'cluster') {
        map.addLayer(clusterLayer);
        map.removeLayer(heatLayer);
      } else {
        map.addLayer(heatLayer);
        map.removeLayer(clusterLayer);
      }
    }
  }, [viewMode, clusterLayer, heatLayer, map]);

  // Add custom control for toggling view
  useEffect(() => {
    const customControl = L.Control.extend({
      options: {
        position: 'topright'
      },
      onAdd: function() {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
        container.style.backgroundColor = 'white';
        container.style.padding = '5px';
        container.innerHTML = `
          <button id="cluster-btn" style="margin-right: 5px;">Cluster</button>
          <button id="heat-btn">Heat</button>
        `;
        
        L.DomEvent.disableClickPropagation(container);
        
        container.querySelector('#cluster-btn').addEventListener('click', () => setViewMode('cluster'));
        container.querySelector('#heat-btn').addEventListener('click', () => setViewMode('heat'));
        
        return container;
      }
    });
    
    map.addControl(new customControl());

    return () => {
      // Cleanup if needed
    };
  }, [map]);

  return null;
};

export default CrimeMapLayer;