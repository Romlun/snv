import { Donor, Church, Project, Task, Staff, Resource, BudgetEntry } from '../types/crm';

export const staff: Staff[] = [
  { id: 's1', name: 'John Director', email: 'john@mission.org', role: 'Mission Director' },
  { id: 's2', name: 'Sarah Donor', email: 'sarah@mission.org', role: 'Donor Relations' },
  { id: 's3', name: 'Mike Church', email: 'mike@mission.org', role: 'Church Relations' },
];

export const donors: Donor[] = [
  {
    id: 'd1',
    name: 'Robert & Mary Smith',
    email: 'smith@example.com',
    phone: '555-0101',
    relationshipStatus: 'Engaged',
    stage: 'Monthly supporter',
    assignedStaffId: 's2',
    lastContactDate: '2025-06-15',
    nextFollowUpDate: '2025-07-15',
    interests: ['Education', 'Church Planting'],
    preferredContactMethod: 'Email',
    tags: ['Active donor', 'Monthly donor'],
    engagementScore: 95,
    notes: 'Long-time supporters of the village project.',
    lifetimeGiving: 12500,
    yearsSupported: 5,
    isRecurring: true,
    recurringAmount: 200,
    recurringCadence: 'monthly',
    givingHistory: [
      { date: '2025-06-01', amount: 200, isRecurring: true },
      { date: '2025-05-01', amount: 200, isRecurring: true },
    ]
  },
  {
    id: 'd2',
    name: 'James Wilson',
    email: 'james@example.com',
    phone: '555-0102',
    relationshipStatus: 'Cooling',
    stage: 'Active donor',
    assignedStaffId: 's2',
    lastContactDate: '2025-03-10',
    nextFollowUpDate: '2025-06-20',
    interests: ['Clean Water'],
    preferredContactMethod: 'Phone',
    tags: ['Major donor', 'Needs follow-up'],
    engagementScore: 45,
    notes: 'Missed his last two expected gifts. Needs a call.',
    lifetimeGiving: 5000,
    yearsSupported: 2,
    isRecurring: false,
    givingHistory: [
      { date: '2025-02-15', amount: 1000, isRecurring: false },
    ]
  },
  {
    id: 'd3',
    name: 'Elena Petrova',
    email: 'elena@example.com',
    phone: '555-0103',
    relationshipStatus: 'Engaged',
    stage: 'New contact',
    assignedStaffId: 's2',
    lastContactDate: '2025-06-25',
    nextFollowUpDate: '2025-06-30',
    interests: ['Translation', 'Bibles'],
    preferredContactMethod: 'Text',
    tags: ['New donor'],
    engagementScore: 88,
    notes: 'Met at the regional conference. Very interested in Russian translations.',
    lifetimeGiving: 50,
    yearsSupported: 1,
    isRecurring: false,
    givingHistory: [
      { date: '2025-06-25', amount: 50, isRecurring: false },
    ]
  }
];

export const churches: Church[] = [
  {
    id: 'c1',
    name: 'Grace Community Church',
    pastor: 'Pastor Dan',
    address: '123 Grace Way, Springfield',
    phone: '555-0201',
    email: 'office@grace.org',
    denomination: 'Baptist',
    relationshipStatus: 'Engaged',
    engagementScore: 90,
    assignedStaffId: 's3',
    visitHistory: [
      { date: '2025-05-20', visitorId: 's1', purpose: 'Sunday Presentation', outcome: 'Great response, 5 new signups', notes: 'Church is very welcoming.' }
    ],
    nextVisitDate: '2025-10-15',
    totalGiving: 15000
  },
  {
    id: 'c2',
    name: 'First Mission Chapel',
    pastor: 'Steve Miller',
    address: '456 Faith St, River City',
    phone: '555-0202',
    email: 'steve@firstmission.org',
    denomination: 'Non-denominational',
    relationshipStatus: 'At risk',
    engagementScore: 30,
    assignedStaffId: 's3',
    visitHistory: [
      { date: '2024-11-10', visitorId: 's3', purpose: 'Introduction', outcome: 'Waiting for board decision', notes: 'Need to follow up with the missions committee.' }
    ],
    totalGiving: 0
  }
];

export const projects: Project[] = [
  {
    id: 'p1',
    name: 'Village Well Project',
    description: 'Drilling 5 wells in the northern province.',
    goal: 'Provide clean water to 1000 people.',
    budgetNeeded: 25000,
    currentFunding: 18500,
    startDate: '2025-01-01',
    status: 'Active',
    assignedStaffIds: ['s1'],
    tags: ['Water', 'Development']
  },
  {
    id: 'p2',
    name: 'Russian Bible Translation',
    description: 'Translating the New Testament into contemporary Russian.',
    goal: 'Distribute 5000 copies.',
    budgetNeeded: 15000,
    currentFunding: 12000,
    startDate: '2025-03-01',
    status: 'Planning',
    assignedStaffIds: ['s2'],
    tags: ['Translation', 'Bibles']
  }
];

export const tasks: Task[] = [
  {
    id: 't1',
    title: 'Call James Wilson',
    description: 'Check in since he missed his monthly gift.',
    assignedTo: 's2',
    relatedToId: 'd2',
    relatedToType: 'donor',
    dueDate: '2025-06-20',
    priority: 'High',
    status: 'In progress'
  },
  {
    id: 't2',
    title: 'Send thank you to Elena',
    description: 'Send a personalized note for her first gift.',
    assignedTo: 's2',
    relatedToId: 'd3',
    relatedToType: 'donor',
    dueDate: '2025-06-28',
    priority: 'Medium',
    status: 'Not started'
  },
  {
    id: 't3',
    title: 'Update project report for wells',
    description: 'Gather photos from the field for the June update.',
    assignedTo: 's1',
    relatedToId: 'p1',
    relatedToType: 'project',
    dueDate: '2025-06-30',
    priority: 'Medium',
    status: 'Not started'
  }
];

export const resources: Resource[] = [
  {
    id: 'r1',
    title: 'Mission Handbook',
    category: 'Training',
    quantityAvailable: 150,
    quantitySold: 45,
    quantityGiven: 20,
    price: 15,
    location: 'Warehouse A'
  },
  {
    id: 'r2',
    title: 'Russian Study Bible',
    category: 'Bibles',
    quantityAvailable: 500,
    quantitySold: 120,
    quantityGiven: 300,
    price: 25,
    location: 'Office'
  }
];

export const budgetEntries: BudgetEntry[] = [
  { id: 'b1', category: 'General', name: 'Operations', needed: 100000, raised: 75000, isProjectBased: false },
  { id: 'b2', category: 'Projects', name: 'Village Wells', needed: 25000, raised: 18500, isProjectBased: true, projectId: 'p1' },
  { id: 'b3', category: 'Travel', name: 'Mission Trips', needed: 15000, raised: 12000, isProjectBased: false },
];
