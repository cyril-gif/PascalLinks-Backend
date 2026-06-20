/**
 * api.js
 * ------------------------------------------------
 * Helper module to communicate with our backend API.
 * All endpoints are relative to the backend base URL.
 */

// Backend URL (no trailing slash)
const API_BASE = 'https://pascallinks-frontend.onrender.com/api';

/**
 * Generic fetch wrapper with error handling.
 */
async function apiCall(endpoint, method = 'GET', body = null, token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.details || data.error || 'API request failed');
    }
    return data;
  } catch (error) {
    console.error(`API call error (${endpoint}):`, error);
    throw error;
  }
}

/**
 * Fetch plans for a given network.
 */
async function fetchPlans(network) {
  return apiCall(`/plans/${network}`);
}

/**
 * Initiate an order (payment).
 * @param {object} orderData - { network, package_size, beneficiary }
 * @param {string|null} token - JWT token (if user is logged in)
 */
async function initiateOrder(orderData, token = null) {
  return apiCall('/orders/initiate', 'POST', orderData, token);
}

/**
 * Confirm payment (called by Paystack redirect/webhook).
 */
async function confirmPayment(reference) {
  return apiCall('/orders/confirm', 'POST', { reference });
}

// Expose globally
window.api = {
  API_BASE,
  fetchPlans,
  initiateOrder,
  confirmPayment
};
