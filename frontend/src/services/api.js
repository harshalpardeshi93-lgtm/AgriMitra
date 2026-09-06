const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

/**
 * Utility to parse and throw standard backend errors
 */
async function handleApiResponse(response, defaultMessage = 'An unexpected error occurred.') {
  if (response.ok) return response;
  
  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent('auth_error', { detail: 401 }));
    throw new Error('Your session has expired. Please log in again.');
  }
  
  const errorData = await response.json().catch(() => ({}));
  let errorMessage = errorData.detail;
  
  // Handle FastAPI 422 validation arrays
  if (Array.isArray(errorMessage)) {
    errorMessage = errorMessage.map(e => {
      const loc = e.loc.length > 1 ? e.loc.slice(1).join('.') + ': ' : '';
      return `${loc}${e.msg}`;
    }).join(', ');
  }
  
  throw new Error(errorMessage || defaultMessage);
}

/**
 * Wrapper for fetch that automatically injects the Authorization header
 * and handles 401/403 responses globally.
 */
async function authenticatedFetch(url, options = {}) {
  const token = localStorage.getItem('agrimitra_token');
  const headers = {
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });
  return await handleApiResponse(response);
}

/**
 * Fetch health status from backend FastAPI server
 */
export async function fetchHealthStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    await handleApiResponse(response, 'Failed to connect to backend API.');
    return await response.json();
  } catch (error) {
    console.warn('Backend API connection warning:', error.message);
    return { status: 'offline', service: 'AgriMitra API (Disconnected)' };
  }
}

/**
 * Fetch available crops from GET /api/crops
 */
export async function getCrops() {
  const response = await fetch(`${API_BASE_URL}/crops`);
  await handleApiResponse(response, 'Failed to fetch crops list');
  return await response.json();
}

/**
 * Fetch available markets from GET /api/markets
 */
export async function getMarkets(state = '', district = '') {
  const params = new URLSearchParams();
  if (state) params.append('state', state);
  if (district) params.append('district', district);

  const url = `${API_BASE_URL}/markets${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url);
  await handleApiResponse(response, 'Failed to fetch markets list');
  return await response.json();
}

/**
 * Fetch market prices for a given crop from GET /api/prices
 */
export async function getMarketPrices({ cropId, state = '', district = '', date = '' }) {
  if (!cropId) {
    throw new Error('cropId is required');
  }

  const params = new URLSearchParams({ crop_id: cropId });
  if (state) params.append('state', state);
  if (district) params.append('district', district);
  if (date) params.append('date', date);

  const response = await fetch(`${API_BASE_URL}/prices?${params.toString()}`);
  if (response.status === 404) return [];
  await handleApiResponse(response, 'We couldn\'t load market prices. Please try again.');
  return await response.json();
}

/**
 * Fetch historical price trends from GET /api/trends
 */
export async function getTrends({ cropId, marketId, days = 14 }) {
  const params = new URLSearchParams({ crop_id: cropId, marketId, days });
  const response = await fetch(`${API_BASE_URL}/trends?${params.toString()}`);
  await handleApiResponse(response, 'Failed to fetch price trends');
  return await response.json();
}

/**
 * Fetch near-term price forecast from GET /api/forecast
 */
export async function getForecast({ cropId, marketId, horizon = 7 }) {
  const params = new URLSearchParams({ crop_id: cropId, marketId, horizon });
  const response = await fetch(`${API_BASE_URL}/forecast?${params.toString()}`);
  await handleApiResponse(response, 'Failed to fetch price forecast');
  return await response.json();
}

/**
 * Fetch AI Sell Advisor recommendation from GET /api/advisor
 */
export async function getAdvisorRecommendation({ cropId, quantityKg = 500, qualityGrade = 'Grade A' }) {
  const params = new URLSearchParams({
    crop_id: cropId,
    quantity_kg: quantityKg,
    quality_grade: qualityGrade
  });
  const response = await fetch(`${API_BASE_URL}/advisor?${params.toString()}`);
  await handleApiResponse(response, 'Failed to fetch AI Sell Advisor recommendation');
  return await response.json();
}

/**
 * Fetch available produce lots from GET /api/lots
 */
export async function getLots({ cropId, marketId, qualityGrade } = {}) {
  const params = new URLSearchParams();
  if (cropId) params.append('crop_id', cropId);
  if (marketId) params.append('market_id', marketId);
  if (qualityGrade) params.append('quality_grade', qualityGrade);

  const response = await authenticatedFetch(`${API_BASE_URL}/lots?${params.toString()}`);
  return await response.json();
}

/**
 * Fetch a specific produce lot from GET /api/lots/{id}
 */
export async function getLot(lotId) {
  const response = await authenticatedFetch(`${API_BASE_URL}/lots/${lotId}`);
  return await response.json();
}

/**
 * Create a new produce lot POST /api/lots
 */
export async function createProduceLot(lotData) {
  const response = await authenticatedFetch(`${API_BASE_URL}/lots`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(lotData)
  });
  return await response.json();
}

/**
 * Fetch seller's own lots GET /api/lots?farmer_id=X
 */
export async function getMyProduceLots(farmerId) {
  const response = await authenticatedFetch(`${API_BASE_URL}/lots?farmer_id=${farmerId}`);
  return await response.json();
}

/**
 * Create a new offer POST /api/offers
 */
export async function createOffer(offerData) {
  const response = await authenticatedFetch(`${API_BASE_URL}/offers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(offerData)
  });
  return await response.json();
}

/**
 * Fetch buyer's offers GET /api/offers
 */
export async function getMyOffers(buyerId) {
  const url = buyerId ? `${API_BASE_URL}/offers?buyer_id=${buyerId}` : `${API_BASE_URL}/offers`;
  const response = await authenticatedFetch(url);
  return await response.json();
}

/**
 * Fetch all offers received by a seller GET /api/offers/seller/{farmerId}
 */
export async function getOffersReceived(farmerId) {
  const response = await authenticatedFetch(`${API_BASE_URL}/offers/seller/${farmerId}`);
  return await response.json();
}

/**
 * Fetch offers for a specific lot GET /api/offers/lot/{lotId}
 */
export async function getOffersForLot(lotId) {
  const response = await authenticatedFetch(`${API_BASE_URL}/offers/lot/${lotId}`);
  return await response.json();
}

/**
 * Update status of an offer PATCH /api/offers/{offerId}/status
 */
export async function updateOfferStatus(offerId, status) {
  const response = await authenticatedFetch(`${API_BASE_URL}/offers/${offerId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status })
  });
  return await response.json();
}

/**
 * User Login POST /api/auth/login
 */
export async function loginApi(phone, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ phone, password })
  });
  await handleApiResponse(response, 'Phone number or password is incorrect.');
  return await response.json();
}

/**
 * User Registration POST /api/auth/register
 */
export async function registerApi(userData) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData)
  });
  await handleApiResponse(response, 'We couldn\'t create your account. Please try again.');
  return await response.json();
}

/**
 * Fetch transactions for a farmer/seller GET /api/transactions/farmer/{farmerId}
 */
export async function getFarmerTransactions(farmerId) {
  const response = await authenticatedFetch(`${API_BASE_URL}/transactions/farmer/${farmerId}`);
  return await response.json();
}

/**
 * Fetch transactions for a buyer GET /api/transactions/buyer/{buyerId}
 */
export async function getBuyerTransactions(buyerId) {
  const response = await authenticatedFetch(`${API_BASE_URL}/transactions/buyer/${buyerId}`);
  return await response.json();
}

/**
 * Fetch specific transaction details GET /api/transactions/{transactionId}
 */
export async function getTransactionDetails(transactionId) {
  const response = await authenticatedFetch(`${API_BASE_URL}/transactions/${transactionId}`);
  return await response.json();
}

/**
 * Update transaction payment status PATCH /api/transactions/{transactionId}/payment-status
 */
export async function updatePaymentStatus(transactionId, paymentStatus) {
  const response = await authenticatedFetch(`${API_BASE_URL}/transactions/${transactionId}/payment-status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ payment_status: paymentStatus })
  });
  return await response.json();
}

/**
 * Update transaction status PATCH /api/transactions/{transactionId}/status
 */
export async function updateTransactionStatus(transactionId, transactionStatus) {
  const response = await authenticatedFetch(`${API_BASE_URL}/transactions/${transactionId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ transaction_status: transactionStatus })
  });
  return await response.json();
}

/**
 * Fetch registered buyers GET /api/auth/buyers
 */
export async function getBuyersApi() {
  const response = await authenticatedFetch(`${API_BASE_URL}/auth/buyers`);
  return await response.json();
}
