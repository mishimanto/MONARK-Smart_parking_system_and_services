import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";
export const APP_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

export const getStoredToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

export const clearAuthData = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
};

// Axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    timeout: 10000,
});

// Add token to requests automatically
api.interceptors.request.use((config) => {
    const token = getStoredToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            clearAuthData();
        }
        return Promise.reject(error);
    }
);

export const registerUser = async (formData) => {
    const response = await api.post('/register', formData);
    return response.data;
};

export const loginUser = async (form) => {
  try {
    const response = await api.post('/login', form, {
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 429) {
      return { message: "Too many login attempts. Please wait and try again." };
    }

    if (error.response && error.response.status === 401) {
      return { message: "Invalid email or password" };
    }

    if (error.response?.data?.message) {
      return { message: error.response.data.message };
    }

    return { message: "Network or server error. Please try again." };
  }
};

export const verifyAdminTwoFactor = async (payload) => {
  try {
    const response = await api.post('/login/admin-2fa', payload, {
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 429) {
      return { message: "Too many verification attempts. Please wait and try again." };
    }

    if (error.response?.data?.message) {
      return { message: error.response.data.message };
    }

    return { message: "Network or server error. Please try again." };
  }
};

let pendingMeRequest = null;

export const getMe = async () => {
    if (!pendingMeRequest) {
        pendingMeRequest = api.get('/me')
            .then((response) => response.data)
            .finally(() => {
                pendingMeRequest = null;
            });
    }

    return pendingMeRequest;
};

export const logoutUser = async () => {
    const response = await api.post('/logout');
    clearAuthData();
    return response.data;
};

export const walletAPI = {
    getBalance: async () => {
        try {
            const response = await api.get('/wallet/balance');
            return response.data;
        } catch (error) {
            console.error("🔴 client.js: API Error:", error);
            throw error;
        }
    },
    topup: async (data) => {
        try {
            const response = await api.post('/wallet/topup', data);
            return response.data;
        } catch (error) {
            console.error("🔴 client.js: Topup Error:", error);
            throw error;
        }
    },
    transactions: async () => {
        try {
            const response = await api.get('/wallet/transactions');
            return response.data;
        } catch (error) {
            console.error("🔴 client.js: Transactions Error:", error);
            throw error;
        }
    }
};

export const bookingAPI = {
    createWithWallet: (data) => api.post('/bookings/wallet', data),
    getAll: (params = {}) => api.get('/bookings', { params }), // This should match your Laravel route
    getActive: () => api.get('/bookings/active'),
    cancel: (id) => api.put(`/bookings/${id}/cancel`),
    getHistory: () => api.get('/bookings/history'),
    requestCheckout: (bookingId) => 
        api.post(`/bookings/${bookingId}/request-checkout`),
  
    payExtraCharges: (bookingId) => 
        api.post(`/bookings/${bookingId}/pay-extra-charges`),

    // Download ticket
    downloadTicket: (bookingId) => {
      return api.get(`/bookings/${bookingId}/download-ticket`, {
        responseType: 'blob' // Important for file download
      });
    }
};

// Admin related APIs
export const adminAPI = {
  
  getPendingCheckouts: (params = {}) => 
    api.get('/pending-checkouts', { params }),
  
  approveCheckout: (checkoutId) => 
    api.post(`/checkouts/${checkoutId}/approve`),
  
  rejectCheckout: (checkoutId) => 
    api.post(`/checkouts/${checkoutId}/reject`),

  getCheckoutStats: () => 
    api.get('/admin/checkouts/stats')
};

export const serviceOrdersAPI = {
  // Get user's service orders
  getUserOrders: (params = {}) => api.get('/service-orders', { params }),
  
  // Book a new service
  bookService: (data) => api.post('/service-orders', data),

  cancelOrder: (id, reason = "") => api.put(`/service-orders/${id}/cancel`, { reason })
};
export const getAbout = () => axios.get(`${API_BASE_URL}/about`);
export const getContact = () => axios.get(`${API_BASE_URL}/contact`);
export const sendMessage = (data) => axios.post(`${API_BASE_URL}/messages`, data);

export const getSiteSettings = async () => {
  const response = await api.get('/site-settings');
  return response.data;
};

export const getAdminSiteSettings = async () => {
  const response = await api.get('/admin/site-settings');
  return response.data;
};

export const updateAdminSiteSettings = async (settingsData) => {
  const response = await api.put('/admin/site-settings', settingsData);
  return response.data;
};

export const uploadSiteSettingMedia = async (formData) => {
  const response = await api.post('/admin/site-settings/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 30000,
  });
  return response.data;
};

export const getAdminTeamMembers = async (page = 1, perPage = 10, filters = {}) => {
  const response = await api.get('/admin/team-members', {
    params: {
      page,
      per_page: perPage,
      q: filters.q || undefined,
      status: filters.status || undefined,
      role: filters.role || undefined,
    },
  });
  return response.data;
};

export const getAdminTeamMember = async (id) => {
  const response = await api.get(`/admin/team-members/${id}`);
  return response.data;
};

export const createTeamMember = async (memberData) => {
  const response = await api.post('/admin/team-members', memberData);
  return response.data;
};

export const updateTeamMember = async (id, memberData) => {
  const response = await api.put(`/admin/team-members/${id}`, memberData);
  return response.data;
};

export const deleteTeamMember = async (id) => {
  const response = await api.delete(`/admin/team-members/${id}`);
  return response.data;
};

export const toggleTeamMemberStatus = async (id) => {
  const response = await api.patch(`/admin/team-members/${id}/status`);
  return response.data;
};

export const uploadTeamMemberImage = async (formData) => {
  const response = await api.post('/admin/team-members/upload-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 30000,
  });
  return response.data;
};

export const bulkDeleteAdminResource = async (resource, ids) => {
  const response = await api.post('/admin/bulk-delete', { resource, ids });
  return response.data;
};

export const getAdminServices = async (page = 1, perPage = 10, filters = {}) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const response = await axios.get(`${API_BASE_URL}/admin/services`, {
    params: {
      page,
      per_page: perPage,
      q: filters.q || undefined,
      status: filters.status || undefined,
    },
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.data;
};

export const createService = async (serviceData) => {
  try {
    const response = await api.post('/admin/services', serviceData);
    return response.data;
  } catch (error) {
    console.error('Error in createService:', error);
    throw error;
  }
};

export const updateService = async (id, serviceData) => {
  try {
    const response = await api.put(`/admin/services/${id}`, serviceData);
    return response.data;
  } catch (error) {
    console.error('Error in updateService:', error);
    throw error;
  }
};

export const deleteService = async (id) => {
  try {
    const response = await api.delete(`/admin/services/${id}`);
    return response.data;
  } catch (error) {
    console.error('🔴 Delete service error:', error);
    console.error('🔴 Error response:', error.response);
    
    // Better error message
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        'Failed to delete service';
    
    // Create a custom error object
    const customError = new Error(errorMessage);
    customError.response = error.response;
    throw customError;
  }
};

export const toggleServiceStatus = async (id) => {
  try {
    const response = await api.put(`/admin/services/${id}/toggle-status`);
    return response.data;
  } catch (error) {
    console.error('Error in toggleServiceStatus:', error);
    throw error;
  }
};

export const uploadServiceImage = async (formData) => {
  try {
    const response = await api.post('/admin/upload-service-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 30000 // 30 seconds timeout
    });
    return response.data;
  } catch (error) {
    console.error('🔴 Service image upload error:', error);
    
    if (error.response) {
      console.error('🔴 Server response:', error.response.data);
      console.error('🔴 Status:', error.response.status);
    } else if (error.request) {
      console.error('🔴 No response received:', error.request);
    } else {
      console.error('🔴 Error message:', error.message);
    }
    
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error ||
                        'Failed to upload service image';
    
    const customError = new Error(errorMessage);
    customError.response = error.response;
    throw customError;
  }
};


// Get user profile
export const getProfile = async () => {
  const response = await api.get('/profile');
  return response.data;
};

// Update profile
export const updateProfile = async (profileData) => {
  const response = await api.put('/profile', profileData);
  return response.data;
};

export const uploadProfileAvatar = async (file) => {
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await api.post('/profile/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Change password
export const changePassword = async (passwordData) => {
  const response = await api.put('/change-password', passwordData);
  return response.data;
};

// Forgot Password API calls
export const forgotPassword = async (email) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/forgot-password`, {
      email: email
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Network error' };
  }
};

export const resetPassword = async (resetData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/reset-password`, resetData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Network error' };
  }
};


export default api;
