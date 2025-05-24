import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = "http://192.168.137.91:5000";
export { API_BASE_URL };

export const api = {
  async get(endpoint) {
    try {
      console.log(`GET request to: ${API_BASE_URL}${endpoint}`);
      
      // Get the auth token
      const token = await AsyncStorage.getItem('token');
      const headers = {
        'Accept': 'application/json',
      };
      
      // Add authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      console.log('Request headers:', headers);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error (${endpoint}):`, response.status, errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
        } catch (e) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API GET Error (${endpoint}):`, error);
      throw error;
    }
  },

  async post(endpoint, data, isFormData = false) {
    try {
      console.log(`POST request to: ${API_BASE_URL}${endpoint}`);
      
      // Get the auth token
      const token = await AsyncStorage.getItem('token');
      const headers = isFormData
        ? {} // Don't set Content-Type for FormData
        : { 'Content-Type': 'application/json' };
      
      // Add authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log('Request headers:', headers);
      console.log('Request data:', isFormData ? 'FormData object' : data);

      const body = isFormData ? data : JSON.stringify(data);

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error (${endpoint}):`, response.status, errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
        } catch (e) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
      }

      return await response.json();
    } catch (error) {
      console.error(`API POST Error (${endpoint}):`, error);
      throw error;
    }
  },

  // Add a dedicated method for FormData uploads
  async postForm(endpoint, formData) {
    try {
      console.log(`POST form request to: ${API_BASE_URL}${endpoint}`);
      
      // Get the auth token
      const token = await AsyncStorage.getItem('token');
      const headers = {};
      
      // Add authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log('Request headers:', headers);
      console.log('Uploading FormData...');

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error (${endpoint}):`, response.status, errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
        } catch (e) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
      }

      return await response.json();
    } catch (error) {
      console.error(`API POST Form Error (${endpoint}):`, error);
      throw error;
    }
  },
};


