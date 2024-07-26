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

  const handleReRaise = async (reportId) => {
    try {
      await axios.put(`http://localhost:5050/api/reraise_case/${reportId}`);
      // Fetch updated reports
      const response = await axios.get(`http://localhost:5050/api/user_reports/${user.primaryEmailAddress.emailAddress}`);
      setReports(response.data);
    } catch (err) {
      setError('Failed to re-raise the case');
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h1>My Reports</h1>
      {reports.length === 0 ? (
        <div>You haven't filed any reports yet.</div>
      ) : (
        <div className="reports-list">
          {reports.map((report) => (
            <div key={report.id} className="report-item">
              <h3>{report.type}</h3>
              <p>{report.description}</p>
              <p>Reported on: {new Date(report.timestamp).toLocaleString()}</p>
              <p>Status: {report.status === 'active' ? 'Active' : 'Solved'}</p>
              {report.status === 'solved' && <p>Solved by: {report.solved_by}</p>}
              {report.status === 'solved' && (
                <button onClick={() => handleReRaise(report.id)}>Re-raise</button>
              )}
              {report.media_url && (
                <img src={report.media_url} alt="Report Media" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyReports;
