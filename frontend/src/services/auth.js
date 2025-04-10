import api from './api';

export default {
  async login(email, password = '', roleCode = '') {
    try {
      const isSpecialUser = email.includes('@ngo.com') || email.includes('@gov.com');
      const response = await api.post('/auth/login', {
        email,
        password: isSpecialUser ? '' : password,
        role_code: isSpecialUser ? roleCode : ''
      });

      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('userRole', response.data.role);
      localStorage.setItem('userId', response.data.user_id);
      localStorage.setItem('email', email);

      return {
        data: {
          access_token: response.data.access_token,
          role: response.data.role,
          user_id: response.data.user_id
        }
      };
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.error || 'Authentication failed');
      }
      throw new Error('Network error');
    }
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('email');
    return true;
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
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.error || 'Registration failed');
      }
      throw new Error('Network error');
    }
  },

  async resendVerification(email) {
    try {
      const response = await api.post('/auth/resend-verification', { email });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.error || 'Failed to resend verification');
      }
      throw new Error('Network error');
    }
  },

  async validateEmail(email) {
    try {
      const response = await api.post('/auth/validate-email', {email});
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.error || 'Email validation failed');
      }
      throw new Error(error.message || 'Network error');
    }
  }
};