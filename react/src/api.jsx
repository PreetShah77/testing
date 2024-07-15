import axios from 'axios';

const API_URL = 'http://localhost:5050';

export const submitReport = async (report) => {
  try {
    const response = await axios.post(`${API_URL}/submit-report`, report);
    return response.data;
  } catch (error) {
    console.error('Error submitting report:', error);
  }
};

export const fetchReports = async () => {
  try {
    const response = await axios.get(`${API_URL}/get-reports`);
    return response.data;
  } catch (error) {
    console.error('Error fetching reports:', error);
  }
};
