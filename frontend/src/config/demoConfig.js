/**
 * Centralized Demo Identity Configuration
 * Demo credentials and IDs for hackathon prototype evaluation.
 * Demo identity only — replace with authenticated user ID when authentication is implemented.
 */
// Legacy config file - IDs have been moved to dynamic JWT session evaluation
export const DEMO_FPO_ID = 3;

export const DEMO_USERS = [
  { id: 1, role: 'farmer', name: 'Ramesh Farmer', phone: '9876543210', password: 'demo123', location: 'Nashik, Maharashtra', label: 'Farmer Demo' },
  { id: 2, role: 'buyer', name: 'Suresh Buyer', phone: '9876543211', password: 'demo123', location: 'Mumbai, Maharashtra', label: 'Buyer Demo' },
  { id: 3, role: 'fpo', name: 'FPO Nashik', phone: '9876543212', password: 'demo123', location: 'Nashik, Maharashtra', label: 'FPO Demo' },
];
