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
  const [search, setSearch] = useState('');
  const [view, setView] = useState('dashboard');
  const [typeFilter, setTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    fetchCrimes();
  }, [search, typeFilter, startDate, severityFilter]);

  const fetchCrimes = async () => {
    try {
      const response = await axios.get('http://localhost:5050/api/police_dashboard', {
        params: { search, type: typeFilter, startDate, severity: severityFilter },
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
            <input
              type="text"
              placeholder="Search by type or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            <Filters
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
              startDate={startDate}
              setStartDate={setStartDate}
              crimeTypes={crimeTypes}
              severityFilter={severityFilter}
              setSeverityFilter={setSeverityFilter}
            />
            <div className="stats-container">
              <div className="chart-container">
                <h2>Crime Statistics</h2>
                <Bar data={crimeData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
              <div className="chart-container">
                <h2>Crime Distribution</h2>
                <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
              <div className="chart-container">
                <h2>Crimes Over Time</h2>
                <Line data={dateData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>
          </>
        )}
        {view === 'reported-crimes' && (
          <>
            <h1>Reported Crimes</h1>
            <input
              type="text"
              placeholder="Search reported crimes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            <Filters
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
              startDate={startDate}
              setStartDate={setStartDate}
              crimeTypes={crimeTypes}
              severityFilter={severityFilter}
              setSeverityFilter={setSeverityFilter}
            />
            <div className="crime-table-container">
              <table className="crime-table" bgcolor="#ffffff">
                <thead>
                  <tr>
                    {['ID', 'Type', 'Description', 'Latitude', 'Longitude', 'Timestamp', 'Anonymous', 'User Info', 'Media URL', 'Severity', 'Status'].map((header) => (
                      <th key={header} onClick={() => handleSort(header.toLowerCase())}>
                        {header}
                        {sortBy === header.toLowerCase() && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                      </th>
                    ))}
                    <th>Get There</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCrimes.map((crime) => (
                    <tr key={crime.id}>
                      <td>{crime.id}</td>
                      <td>{crime.type}</td>
                      <td>{crime.description}</td>
                      <td>{crime.latitude}</td>
                      <td>{crime.longitude}</td>
                      <td>{new Date(crime.timestamp).toLocaleString()}</td>
                      <td>{crime.anonymous ? 'Yes' : 'No'}</td>
                      <td>{crime.anonymous ? 'Anonymous' : crime.user_info}</td>
                      <td>
                        {crime.media_url ? (
                          <a href={crime.media_url} target="_blank" rel="noopener noreferrer">Link</a>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>{crime.severity}</td>
                      <td>{crime.status}</td>
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
                      <td>
                        {crime.status === 'active' && (
                          <button onClick={() => handleSolveCase(crime.id)}>Mark as Solved</button>
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