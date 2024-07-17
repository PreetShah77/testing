import React, { useState, useEffect } from 'react';
import { useUser } from "@clerk/clerk-react";
import axios from 'axios';
import '../styles/MyReports.css';

const MyReports = () => {
  const { user } = useUser();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserReports = async () => {
      if (user && user.primaryEmailAddress) {
        try {
          const response = await axios.get(`http://localhost:5050/api/user_reports/${user.primaryEmailAddress.emailAddress}`);
          setReports(response.data);
          setIsLoading(false);
        } catch (err) {
          setError('Failed to fetch reports');
          setIsLoading(false);
        }
      }
    };

    fetchUserReports();
  }, [user]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="my-reports-container">
      <h2>My Reports</h2>
      {reports.length === 0 ? (
        <p>You haven't filed any reports yet.</p>
      ) : (
        <ul className="reports-list">
          {reports.map((report) => (
            <li key={report.id} className="report-item">
              <h3>{report.type}</h3>
              <p>{report.description}</p>
              <p>Reported on: {new Date(report.timestamp).toLocaleString()}</p>
              <p>Status: {report.status === 'active' ? 'Active' : 'Solved'}</p>
              {report.media_url && (
                <img src={report.media_url} alt="Report media" className="report-media" />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MyReports;