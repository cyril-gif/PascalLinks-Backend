/**
 * api.js
 * ------------------------------------------------
 * Helper module to communicate with our backend API.
 * All endpoints are relative to the backend base URL.
 */

const API_BASE = window.location.origin.includes('localhost')
  ? 'http://localhost:5000/api'        // development
  : 'https://your-backend.com/api';    // production – set correctly

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
    credentials: 'include',
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
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
  return apiCall(`/plans/${network}`); // we need a plans route – assume exists
}

/**
 * Initiate an order (payment).
 */
async function initiateOrder(orderData) {
  return apiCall('/orders/initiate', 'POST', orderData);
}

/**
 * Confirm payment (usually called by backend webhook, but we might call it manually).
 */
async function confirmPayment(reference) {
  return apiCall('/orders/confirm', 'POST', { reference });
}

// Expose globally for use in app.js
window.api = { fetchPlans, initiateOrder, confirmPayment };
