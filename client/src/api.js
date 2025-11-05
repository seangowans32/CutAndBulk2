// API base URL - points to Express server
// Use environment variable in production, relative URL for same-origin requests
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Generic API request function with credentials support
 */
async function apiRequest(path, options = {}) {
  const { method = 'GET', body, headers = {} } = options;
  
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method,
      credentials: 'include', // Important: sends cookies with request
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      const errorMessage = data.error || `Request failed with status ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status; // Include status code for handling
      throw error;
    }
    
    return data;
  } catch (error) {
    // If it's already our custom error with status, re-throw it
    if (error.status) {
      throw error;
    }
    // Otherwise, wrap the error
    throw error;
  }
}

// Authentication API methods
export const AuthAPI = {
  // Register new user
  register: (userData) => apiRequest('/auth/register', {
    method: 'POST',
    body: userData
  }),
  
  // Login user - receives JWT token in httpOnly cookie
  login: (credentials) => apiRequest('/auth/login', {
    method: 'POST',
    body: credentials
  }),
  
  // Logout user - clears cookie
  logout: () => apiRequest('/auth/logout', {
    method: 'GET'
  }),
  
  // Get current user data (requires authentication)
  getUser: () => apiRequest('/auth/user', {
    method: 'GET'
  }),
};

// User Data API methods
export const UserAPI = {
  // Update body data (weight, height, gender, activityLevel, calories)
  updateBodyData: (bodyData) => apiRequest('/auth/body-data', {
    method: 'PUT',
    body: bodyData
  }),
  
  // Add favorite food
  addFavoriteFood: (foodData) => apiRequest('/auth/favorite-foods', {
    method: 'POST',
    body: foodData
  }),
  
  // Remove favorite food
  removeFavoriteFood: (foodData) => apiRequest('/auth/favorite-foods', {
    method: 'DELETE',
    body: foodData
  }),
  
  // Update favorite food quantity
  updateFavoriteFoodQuantity: (foodData) => apiRequest('/auth/favorite-foods/quantity', {
    method: 'PUT',
    body: foodData
  }),
  
  // Update daily calories
  updateDailyCalories: (calories) => apiRequest('/auth/daily-calories', {
    method: 'PUT',
    body: { dailyCalories: calories }
  }),
};