import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import '../styles/Dashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [crimes, setCrimes] = useState([]);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('dashboard');

  useEffect(() => {
    fetchCrimes();
  }, [search]);

  const fetchCrimes = async () => {
    try {
      const response = await axios.get('http://localhost:5050/api/crimes', {
        params: { search },
      });
      setCrimes(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const crimeTypes = crimes.reduce((acc, crime) => {
    acc[crime.type] = (acc[crime.type] || 0) + 1;
    return acc;
  }, {});

  const crimeDates = crimes.reduce((acc, crime) => {
    const date = new Date(crime.timestamp).toLocaleDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const crimeData = {
    labels: Object.keys(crimeTypes),
    datasets: [
      {
        label: 'Number of Crimes',
        data: Object.values(crimeTypes),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
    ],
  };

  const pieData = {
    labels: Object.keys(crimeTypes),
    datasets: [
      {
        label: 'Crime Distribution',
        data: Object.values(crimeTypes),
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
      },
    ],
  };

  const dateData = {
    labels: Object.keys(crimeDates),
    datasets: [
      {
        label: 'Crimes Over Time',
        data: Object.values(crimeDates),
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
        borderColor: 'rgba(153, 102, 255, 1)',
        fill: false,
      },
    ],
  };

  return (
    <div className="dashboard-container">
      <div className="buttons-container">
        <button onClick={() => setView('dashboard')}>Dashboard</button>
        <button onClick={() => setView('reported-crimes')}>Reported Crimes</button>
      </div>
      {view === 'dashboard' && (
        <>
          <h1>Crime Dashboard</h1>
          <input
            type="text"
            placeholder="Search by type or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <div className="stats-container">
            <div className="chart-container">
              <h2>Crime Statistics</h2>
              <Bar data={crimeData} options={{ responsive: true }} />
            </div>
            <div className="chart-container">
              <h2>Crime Distribution</h2>
              <Pie data={pieData} options={{ responsive: true }} />
            </div>
            <div className="chart-container">
              <h2>Crimes Over Time</h2>
              <Line data={dateData} options={{ responsive: true }} />
            </div>
          </div>
        </>
      )}
      {view === 'reported-crimes' && (
        <>
          <h1>Reported Crimes</h1>
          <table className="crime-table" bgcolor="#ffffff">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Description</th>
                <th>Latitude</th>
                <th>Longitude</th>
                <th>Timestamp</th>
                <th>Anonymous</th>
                <th>Media URL</th>
                <th>Get There</th>
              </tr>
            </thead>
            <tbody>
              {crimes.map((crime) => (
                <tr key={crime.id}>
                  <td>{crime.id}</td>
                  <td>{crime.type}</td>
                  <td>{crime.description}</td>
                  <td>{crime.latitude}</td>
                  <td>{crime.longitude}</td>
                  <td>{new Date(crime.timestamp).toLocaleString()}</td>
                  <td>{crime.anonymous ? 'Yes' : 'No'}</td>
                  <td>
                    {crime.media_url ? (
                      <a href={crime.media_url} target="_blank" rel="noopener noreferrer">Link</a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${crime.latitude},${crime.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="get-there-button"
                    >
                      Get There
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default Dashboard;
