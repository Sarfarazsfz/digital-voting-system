import axios from 'axios';

const API_BASE_URL = 'https://digital-voting-system-backend.onrender.com/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userType');
      localStorage.removeItem('adminToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Admin API calls
export const adminAPI = {
  login: (username, password) => 
    api.post('/admin/login', { username, password }),

  createElection: (electionData) =>
    api.post('/admin/elections', electionData),

  getElections: () =>
    api.get('/admin/elections'),

  getElectionResults: (id) =>
    api.get(`/admin/elections/${id}/results`),

  updateElectionStatus: (id, status) =>
    api.put(`/admin/elections/${id}/status`, { status }),

  getElectionStats: () =>
    api.get('/admin/elections-stats')
};

// Voter API calls
export const voterAPI = {
  verifyAndSendOTP: (aadhaarNumber, age, phone, email) =>
    api.post('/voter/verify-and-send-otp', { aadhaarNumber, age, phone, email }),

  verifyOTP: (voterId, otp) =>
    api.post('/voter/verify-otp', { voterId, otp }),

  resendOTP: (voterId) =>
    api.post('/voter/resend-otp', { voterId }),

  getActiveElections: () =>
    api.get('/voter/elections/active'),

  getElection: (id) =>
    api.get(`/voter/elections/${id}`),

  castVote: (electionId, candidateId, voterId) =>
    api.post('/voter/vote', { electionId, candidateId, voterId }),

  getVotingHistory: (voterId) =>
    api.get(`/voter/${voterId}/history`),

  hasVoted: (voterId, electionId) =>
    api.get(`/voter/${voterId}/has-voted/${electionId}`),

  getProfile: (voterId) =>
    api.get(`/voter/profile/${voterId}`)
};

// Public API calls
export const publicAPI = {
  getPublicElections: () =>
    api.get('/election/public')
};

export default api;