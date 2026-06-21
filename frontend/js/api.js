/**
 * api.js
 * ------------------------------------------------
 * Helper module to communicate with our backend API.
 * All endpoints are relative to the backend base URL.
 */

const API_BASE = 'https://pascallinks-frontend.onrender.com/api';

/**
 * Generic fetch wrapper with error handling.
 */
async function apiCall(endpoint, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

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
 * Fetch plans for a given network and provider.
 * @param {string} network - e.g., 'mtn', 'telecel'
 * @param {string} provider - 'datamart' or 'gigsgrid'
 */
async function fetchPlans(network, provider = 'datamart') {
  return apiCall(`/plans/${network}?provider=${provider}`);
}

/**
 * Initiate an order.
 * @param {object} orderData - { network, package_size, beneficiary, provider }
 * @param {string|null} token - JWT token (if logged in)
 */
async function initiateOrder(orderData, token = null) {
  return apiCall('/orders/initiate', 'POST', orderData, token);
}

/**
 * Confirm payment.
 */
async function confirmPayment(reference) {
  return apiCall('/orders/confirm', 'POST', { reference });
}

// Expose globally
window.api = { API_BASE, fetchPlans, initiateOrder, confirmPayment };
