import api from './api';

export default {
async login(email, password = '', roleCode = '') {
  try {
    const response = await api.post('/auth/login', {
      email,
      password: email.includes('@ngo.com') || email.includes('@gov.com') ? '' : password,
      role_code: email.includes('@ngo.com') || email.includes('@gov.com') ? roleCode : ''
    });

    return { success: true, data: response.data };

  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message,
      status: error.response?.data?.status || 500
    }
  }
  },
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('email');
    localStorage.removeItem('verified');
    return true;
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  },

  isVerified() {
    return localStorage.getItem('verified') === 'true';
  },

  async signup(fullName, email, password, nickname = '') {
    try {
      const response = await api.post('/auth/signup', {
        full_name: fullName,
        email,
        password,
        nickname,
        is_special_user: email.includes('@ngo.com') || email.includes('@gov.com')
      });
      return response.data;
    }
    catch (error) {
      throw new Error(
        error.response?.data?.error ||
        'Registration failed. Please try again.'
      );
    }
  },

  async resendVerification(email) {
    try {
      const response = await api.post('/auth/resend-verification', { email });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error ||
        'Failed to resend verification email'
      );
    }
  },

  async validateEmail(email) {
    try {
      const response = await api.post('/auth/validate-email', {email});
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error ||
        'Email validation failed'
      );
    }
  },
async getReports() {
  try {
    const response = await api.get('/api/reports');
    console.log("Full response:", response);
    return response;
  } catch (error) {
    console.error("Fetch reports error:", error);
    throw new Error(
      error.response?.data?.error || 'Failed to fetch reports'
    );
  }
  }
};