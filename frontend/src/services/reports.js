import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const submitReport = async (formData) => {
  const response = await axios.post(`${API_URL}/submit_report`, formData, {
    withCredentials: true,
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const getReports = async () => {
  const response = await axios.get(`${API_URL}/reports`, { withCredentials: true });
  return response.data;
};

export const claimReport = async (reportId) => {
  const response = await axios.put(`${API_URL}/report/claim/${reportId}`, {}, { withCredentials: true });
  return response.data;
};

export const updateReportStatus = async (reportId, status) => {
  const response = await axios.put(`${API_URL}/report/update/${reportId}`, { status }, { withCredentials: true });
  return response.data;
};