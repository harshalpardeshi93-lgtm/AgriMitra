// PROTOTYPE / DEMO DATA ONLY
// Used for displaying realistic market discovery & buyer connection UI during Phase 1 prototype testing

export const DEMO_CROPS = [
  { id: 'wheat', name: 'Wheat (Sharbati)', category: 'Cereals' },
  { id: 'rice', name: 'Paddy Rice (Basmati 1509)', category: 'Cereals' },
  { id: 'soybean', name: 'Soybean (Yellow)', category: 'Oilseeds' },
  { id: 'maize', name: 'Maize (Hybrid Grain)', category: 'Cereals' },
  { id: 'cotton', name: 'Cotton (Long Staple)', category: 'Fiber' },
  { id: 'onion', name: 'Onion (Red Nashik)', category: 'Vegetables' },
  { id: 'potato', name: 'Potato (Jyoti)', category: 'Vegetables' }
];

export const DEMO_MARKETS = [
  {
    id: 1,
    name: 'Nashik APMC Mandi',
    distanceKm: 18,
    modalPricePerQuintal: 2850,
    priceTrend: '+4.2%',
    estimatedTransportCost: 120,
    demandLevel: 'High',
    verifiedBuyers: 14
  },
  {
    id: 2,
    name: 'Lasalgaon Mandi',
    distanceKm: 42,
    modalPricePerQuintal: 3100,
    priceTrend: '+6.1%',
    estimatedTransportCost: 220,
    demandLevel: 'Very High',
    verifiedBuyers: 22
  },
  {
    id: 3,
    name: 'Pimpalgaon Baswant',
    distanceKm: 28,
    modalPricePerQuintal: 2780,
    priceTrend: '-1.0%',
    estimatedTransportCost: 160,
    demandLevel: 'Moderate',
    verifiedBuyers: 9
  }
];

export const DEMO_PRICE_TRENDS = [
  { date: 'Mon', nashik: 2720, lasalgaon: 2950, pimpalgaon: 2700 },
  { date: 'Tue', nashik: 2750, lasalgaon: 2980, pimpalgaon: 2720 },
  { date: 'Wed', nashik: 2790, lasalgaon: 3020, pimpalgaon: 2750 },
  { date: 'Thu', nashik: 2820, lasalgaon: 3060, pimpalgaon: 2760 },
  { date: 'Fri', nashik: 2850, lasalgaon: 3100, pimpalgaon: 2780 }
];

export const DEMO_BUYER_PROFILE = {
  name: 'GreenField Agro Mills Ltd.',
  type: 'Institutional Buyer / Processor',
  location: 'Indore, Madhya Pradesh',
  licenseNo: 'APMC-MP-98421',
  verificationStatus: 'Verified Partner'
};

export const DEMO_BUYER_REQUIREMENTS = [
  {
    id: 'REQ-101',
    crop: 'Wheat (Sharbati)',
    quantityQuintals: 500,
    minQuality: 'Grade A',
    targetPricePerQuintal: 2900,
    deliveryLocation: 'Indore Processing Unit',
    deadline: '2026-09-15',
    status: 'Open'
  },
  {
    id: 'REQ-102',
    crop: 'Soybean (Yellow)',
    quantityQuintals: 1200,
    minQuality: 'Grade A/B',
    targetPricePerQuintal: 4650,
    deliveryLocation: 'Ujjain Warehouse',
    deadline: '2026-09-20',
    status: 'Open'
  },
  {
    id: 'REQ-103',
    crop: 'Maize (Hybrid)',
    quantityQuintals: 800,
    minQuality: 'Grade B',
    targetPricePerQuintal: 2200,
    deliveryLocation: 'Dhar Feed Mill',
    deadline: '2026-09-10',
    status: 'Fulfilled'
  }
];

export const DEMO_BUYER_OFFERS = [
  {
    id: 'OFF-301',
    fpoName: 'Kisan Samriddhi Farmers Producer Co.',
    crop: 'Wheat (Sharbati)',
    offeredQuantity: 300,
    offeredPrice: 2880,
    qualityGrade: 'Grade A',
    status: 'Under Negotiation',
    submittedDate: '2026-09-04'
  },
  {
    id: 'OFF-302',
    fpoName: 'Sahyadri Farmers Collective',
    crop: 'Soybean (Yellow)',
    offeredQuantity: 500,
    offeredPrice: 4600,
    qualityGrade: 'Grade A',
    status: 'Accepted',
    submittedDate: '2026-09-03'
  }
];

export const DEMO_FPO_SUMMARY = {
  name: 'Sahyadri Krishak Producer Co. Ltd.',
  regNumber: 'FPO-MH-2023-0941',
  location: 'Nashik District, Maharashtra',
  memberFarmersCount: 340,
  aggregatedProduceVolumeQuintals: 4850,
  activeLotsCount: 12,
  activeBuyerConnections: 8
};

export const DEMO_FPO_FARMERS = [
  { id: 'F-001', name: 'Ramesh Patil', village: 'Dindori', crop: 'Grapes / Onion', landAcres: 4.5, totalSubmittedQuintals: 140 },
  { id: 'F-002', name: 'Suresh Deshmukh', village: 'Niphad', crop: 'Soybean / Wheat', landAcres: 6.0, totalSubmittedQuintals: 210 },
  { id: 'F-003', name: 'Sunita Pawar', village: 'Pimpalgaon', crop: 'Tomato / Maize', landAcres: 3.2, totalSubmittedQuintals: 95 },
  { id: 'F-004', name: 'Anil Sonawane', village: 'Chandwad', crop: 'Onion', landAcres: 5.0, totalSubmittedQuintals: 180 }
];

export const DEMO_FPO_LOTS = [
  { id: 'LOT-901', crop: 'Wheat (Sharbati)', totalQuantity: 650, aggregatedFarmers: 12, qualityGrade: 'Grade A', status: 'Ready for Auction', minBidPrice: 2820 },
  { id: 'LOT-902', crop: 'Soybean (Yellow)', totalQuantity: 1100, aggregatedFarmers: 24, qualityGrade: 'Grade A', status: 'Under Quality Testing', minBidPrice: 4580 },
  { id: 'LOT-903', crop: 'Maize Grain', totalQuantity: 800, aggregatedFarmers: 15, qualityGrade: 'Grade B', status: 'Dispatched to Buyer', minBidPrice: 2150 }
];
