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

const Filters = ({ typeFilter, setTypeFilter, startDate, setStartDate, crimeTypes, severityFilter, setSeverityFilter }) => {
  return (
    <div className="filters-container">
      <select
        value={typeFilter}
        onChange={(e) => setTypeFilter(e.target.value)}
        className="filter-select"
      >
        <option value="">All Types</option>
        {Object.keys(crimeTypes).map((type) => (
          <option key={type} value={type}>{type}</option>
        ))}
      </select>
      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        className="filter-date"
      />
      <select
        value={severityFilter}
        onChange={(e) => setSeverityFilter(e.target.value)}
        className="filter-select"
      >
        <option value="">All Severities</option>
        <option value="HIGH">High</option>
        <option value="MEDIUM">Medium</option>
        <option value="LOW">Low</option>
      </select>
    </div>
  );
};

const Dashboard = () => {
  const [crimes, setCrimes] = useState([]);
  const [view, setView] = useState('dashboard');
  const [typeFilter, setTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    fetchCrimes();
  }, [typeFilter, startDate, severityFilter]);

  const fetchCrimes = async () => {
    try {
      const response = await axios.get('http://localhost:5050/api/police_dashboard', {
        params: { type: typeFilter, startDate, severity: severityFilter },
      });
      setCrimes(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSolveCase = async (id) => {
    if (window.confirm("Are you sure you want to mark this case as solved?")) {
      try {
        await axios.put(`http://localhost:5050/api/solve_case/${id}`);
        fetchCrimes(); // Refresh the crime list
      } catch (error) {
        console.error('Error solving case:', error);
      }
    }
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const openGoogleMaps = (latitude, longitude) => {
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    window.open(url, '_blank');
  };

  const filteredCrimes = crimes
    .filter((crime) => {
      const crimeDate = new Date(crime.timestamp);
      return (
        (!typeFilter || crime.type === typeFilter) &&
        (!startDate || crimeDate >= new Date(startDate)) &&
        (!severityFilter || crime.severity === severityFilter)
      );
    })
    .sort((a, b) => {
      // Prioritize SOS crimes
      if (a.type === "SOS" && b.type !== "SOS") return -1;
      if (b.type === "SOS" && a.type !== "SOS") return 1;
      
      if (sortBy) {
        if (sortOrder === 'asc') {
          return a[sortBy] > b[sortBy] ? 1 : -1;
        } else {
          return a[sortBy] < b[sortBy] ? 1 : -1;
        }
      }
      return 0;
    });

  const crimeTypes = filteredCrimes.reduce((acc, crime) => {
    acc[crime.type] = (acc[crime.type] || 0) + 1;
    return acc;
  }, {});

  const crimeDates = filteredCrimes.reduce((acc, crime) => {
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

  const downloadReports = async () => {
    try {
      const response = await axios.get('http://localhost:5050/api/download_crimes', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'crime_reports.xlsx');
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error('Error downloading reports:', error);
    }
  };
  
  return (
    <div className="dashboard-container">
      <div className="buttons-container">
        <button onClick={() => setView('dashboard')}>Dashboard</button>
        <button onClick={() => setView('reported-crimes')}>Reported Crimes</button>
      </div>
      <div className="content-container">
        {view === 'dashboard' && (
          <>
            <h1>Crime Dashboard</h1>
            <div className="search-filter-wrapper">
              <Filters
                typeFilter={typeFilter}
                setTypeFilter={setTypeFilter}
                startDate={startDate}
                setStartDate={setStartDate}
                crimeTypes={crimeTypes}
                severityFilter={severityFilter}
                setSeverityFilter={setSeverityFilter}
              />
            </div>
            <div className="stats-container">
              <div className="chart-container">
                <h2>Crime Statistics</h2>
                <div className="chart-wrapper">
                  <Bar data={crimeData} options={{ 
                    responsive: true, 
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      }
                    }
                  }} />
                </div>
              </div>
              <div className="chart-container">
                <h2>Crime Distribution</h2>
                <div className="chart-wrapper">
                  <Pie data={pieData} options={{ 
                    responsive: true, 
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          boxWidth: 10,
                          font: {
                            size: 10
                          }
                        }
                      }
                    }
                  }} />
                </div>
              </div>
              <div className="chart-container">
                <h2>Crimes Over Time</h2>
                <div className="chart-wrapper">
                  <Line data={dateData} options={{ 
                    responsive: true, 
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      }
                    }
                  }} />
                </div>
              </div>
            </div>
          </>
        )}
        {view === 'reported-crimes' && (
          <>
            <h1>Reported Crimes</h1>
            <div className="search-filter-wrapper">
              <Filters
                typeFilter={typeFilter}
                setTypeFilter={setTypeFilter}
                startDate={startDate}
                setStartDate={setStartDate}
                crimeTypes={crimeTypes}
                severityFilter={severityFilter}
                setSeverityFilter={setSeverityFilter}
              />
            </div>
            <div className="buttons-container">
              <button onClick={downloadReports} className="download-button">Download Reports</button>
            </div>
            <div className="crime-table-container">
              <table className="crime-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('id')}>ID</th>
                    <th onClick={() => handleSort('type')}>Type</th>
                    <th onClick={() => handleSort('description')}>Description</th>
                    <th onClick={() => handleSort('timestamp')}>Timestamp</th>
                    <th onClick={() => handleSort('anonymous')}>Anonymous</th>
                    <th onClick={() => handleSort('user_info')}>User Info</th>
                    <th onClick={() => handleSort('media_url')}>Media URL</th>
                    <th onClick={() => handleSort('severity')}>Severity</th>
                    <th onClick={() => handleSort('status')}>Status</th>
                    <th onClick={() => handleSort('area')}>Area</th>
                    <th>Actions</th>
                    <th>Get There</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCrimes.map((crime) => (
                    <tr key={crime.id}>
                      <td>{crime.id}</td>
                      <td>{crime.type}</td>
                      <td>{crime.description}</td>
                      <td>{new Date(crime.timestamp).toLocaleString()}</td>
                      <td>{crime.anonymous ? 'Yes' : 'No'}</td>
                      <td>{crime.user_info || 'N/A'}</td>
                      <td>{crime.media_url ? <a href={crime.media_url} target="_blank" rel="noopener noreferrer">View</a> : 'N/A'}</td>
                      <td>{crime.severity}</td>
                      <td>{crime.status}</td>
                      <td>{crime.area}</td>
                      <td>
                        {crime.status !== 'SOLVED' && (
                          <button onClick={() => handleSolveCase(crime.id)} className="solve-button">Mark as Solved</button>
                        )}
                        </td>
                        <td>
                        {crime.latitude && crime.longitude && (
                          <button onClick={() => openGoogleMaps(crime.latitude, crime.longitude)} className="get-there-button">Get There</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
