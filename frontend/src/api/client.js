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

// Auth endpoints - IMPORTANT: Remove try-catch so errors propagate
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
    if (error.response && error.response.status === 401) {
      return { message: "Invalid email or password" };
    }

    if (error.response?.data?.message) {
      return { message: error.response.data.message };
    }

    return { message: "Network or server error. Please try again." };
  }
};



// client.js - getMe function update
export const getMe = async () => {
    try {
        const response = await api.get('/me');
        return response.data;
    } catch (error) {
        console.error("Error in getMe:", error);
        throw error; // Re-throw the error so component can handle it
    }
};

export const logoutUser = async () => {
    const response = await api.post('/logout');
    clearAuthData();
    return response.data;
};

export const walletAPI = {
    getBalance: async () => {
        try {
            /*console.log("🟡 client.js: Calling wallet/balance API...");*/
            const response = await api.get('/wallet/balance');
            /*console.log("🟢 client.js: API Response:", response);
            console.log("🟢 client.js: Response Data:", response.data);*/
            return response.data;
        } catch (error) {
            console.error("🔴 client.js: API Error:", error);
            throw error;
        }
    },
    topup: async (data) => {
        try {
            /*console.log("🟡 client.js: Calling wallet/topup API...");*/
            const response = await api.post('/wallet/topup', data);
            /*console.log("🟢 client.js: Topup Response:", response.data);*/
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
    getAll: () => api.get('/bookings'), // This should match your Laravel route
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

    // নতুন method যোগ করুন
  getCheckoutStats: () => 
    api.get('/admin/checkouts/stats')
};

// In your api/client.js
export const serviceOrdersAPI = {
  // Get user's service orders
  getUserOrders: () => api.get('/service-orders'),
  
  // Book a new service
  bookService: (data) => api.post('/service-orders', data),
  
  // Update service order status (for admin)
  updateStatus: (id, status) => api.put(`/service-orders/${id}/status`, { status })
};
export const getAbout = () => axios.get(`${API_BASE_URL}/about`);
export const getContact = () => axios.get(`${API_BASE_URL}/contact`);
export const sendMessage = (data) => axios.post(`${API_BASE_URL}/messages`, data);


// Better: Use axios for all services functions
// api/client.js এ
export const getAdminServices = async (page = 1, perPage = 10) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const response = await axios.get(`${API_BASE_URL}/admin/services?page=${page}&per_page=${perPage}`, {
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
    console.log('🟡 Deleting service:', id);
    const response = await api.delete(`/admin/services/${id}`);
    console.log('🟢 Delete response:', response.data);
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

// Service Image Upload
// client.js - Fix the uploadServiceImage function
export const uploadServiceImage = async (formData) => {
  try {
    console.log('🟡 Uploading service image...', formData);
    
    // Check if formData is properly constructed
    if (formData instanceof FormData) {
      for (let pair of formData.entries()) {
        console.log('🔵 FormData:', pair[0], pair[1]);
      }
    }

    const response = await api.post('/admin/upload-service-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 30000 // 30 seconds timeout
    });
    
    console.log('🟢 Service image upload response:', response.data);
    return response.data;
  } catch (error) {
    console.error('🔴 Service image upload error:', error);
    
    // Detailed error logging
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
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_BASE_URL}/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.data;
};

// Update profile
export const updateProfile = async (profileData) => {
  const token = localStorage.getItem('token');
  const response = await axios.put(`${API_BASE_URL}/profile`, profileData, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.data;
};

// Change password
export const changePassword = async (passwordData) => {
  const token = localStorage.getItem('token');
  const response = await axios.put(`${API_BASE_URL}/change-password`, passwordData, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
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
