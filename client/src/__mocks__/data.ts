import { Item } from '@shared/schema';

// Mock items for testing
export const mockItems: Item[] = [
  {
    id: 1,
    name: 'Tent',
    description: 'A 4-person camping tent',
    brand: 'REI',
    category: 'camping',
    owner: 'testuser',
    locationId: 1,
    spotId: null,
    lentTo: null,
    storageLocation: 'Garage',
    storageAddress: '123 Home St',
    condition: 'Good',
    isShared: true,
    status: 'stored',
    imageUrls: ['/api/uploads/tent.jpg'],
    addedOn: new Date()
  },
  {
    id: 2,
    name: 'Hiking Boots',
    description: 'Waterproof hiking boots',
    brand: 'Salomon',
    category: 'hiking',
    owner: 'testuser',
    locationId: 1,
    spotId: null,
    lentTo: null,
    storageLocation: 'Closet',
    storageAddress: '123 Home St',
    condition: 'Excellent',
    isShared: false,
    status: 'stored',
    imageUrls: ['/api/uploads/boots.jpg'],
    addedOn: new Date()
  },
  {
    id: 3,
    name: 'Mountain Bike',
    description: 'Full suspension mountain bike',
    brand: 'Trek',
    category: 'biking',
    owner: 'testuser',
    locationId: 2,
    spotId: null,
    lentTo: null,
    storageLocation: 'Garage',
    storageAddress: '123 Home St',
    condition: 'Good',
    isShared: true,
    status: 'lent',
    imageUrls: ['/api/uploads/bike.jpg'],
    addedOn: new Date()
  },
  {
    id: 4,
    name: 'Kayak',
    description: 'Recreational kayak',
    brand: 'Pelican',
    category: 'water',
    owner: 'testuser',
    locationId: 2,
    spotId: null,
    lentTo: null,
    storageLocation: 'Shed',
    storageAddress: '123 Home St',
    condition: 'Fair',
    isShared: true,
    status: 'stored',
    imageUrls: ['/api/uploads/kayak.jpg'],
    addedOn: new Date()
  },
  {
    id: 5,
    name: 'Snowboard',
    description: 'All-mountain snowboard',
    brand: 'Burton',
    category: 'winter',
    owner: 'testuser',
    locationId: 3,
    spotId: null,
    lentTo: null,
    storageLocation: 'Storage Unit',
    storageAddress: '456 Storage Way',
    condition: 'Excellent',
    isShared: false,
    status: 'stored',
    imageUrls: ['/api/uploads/snowboard.jpg'],
    addedOn: new Date()
  }
];

// Mock stats
export const mockStats = {
  total: mockItems.length,
  stored: mockItems.filter(item => item.status === 'stored').length,
  inUse: mockItems.filter(item => item.status === 'in_use').length,
  lent: mockItems.filter(item => item.status === 'lent').length,
  unknown: mockItems.filter(item => item.status === 'unknown').length,
};