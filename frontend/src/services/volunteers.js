import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const startMovement = async (reportId, neededVolunteers, scheduledDate) => {
  const response = await axios.post(`${API_URL}/volunteer/start/${reportId}`, {
    needed_volunteers: neededVolunteers,
    scheduled_date: scheduledDate
  }, { withCredentials: true });
  return response.data;
};

export const joinMovement = async (reportId) => {
  const response = await axios.post(`${API_URL}/volunteer/join/${reportId}`, {}, { withCredentials: true });
  return response.data;
};

export const blockMovement = async (reportId) => {
  const response = await axios.put(`${API_URL}/volunteer/block/${reportId}`, {}, { withCredentials: true });
  return response.data;
};

export const unblockMovement = async (reportId) => {
  const response = await axios.put(`${API_URL}/volunteer/unblock/${reportId}`, {}, { withCredentials: true });
  return response.data;
};

export const getActiveMovements = async () => {
  const response = await axios.get(`${API_URL}/volunteer/active-movements`, { withCredentials: true });
  return response.data;
};