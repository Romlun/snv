export type RelationshipStatus = 'Engaged' | 'Steady' | 'Cooling' | 'At risk' | 'Inactive';
export type DonorStage = 'New contact' | 'First conversation' | 'Interested' | 'Active donor' | 'Monthly supporter' | 'Major donor' | 'Needs re-engagement' | 'Inactive';
export type ContactType = 'call' | 'email' | 'text' | 'meeting' | 'church visit' | 'event';
export type ProjectStatus = 'Idea' | 'Planning' | 'Active' | 'Waiting' | 'Completed' | 'Cancelled';
export type TaskStatus = 'Not started' | 'In progress' | 'Waiting' | 'Completed' | 'Cancelled';
export type Priority = 'Low' | 'Medium' | 'High';

export interface ContactLog {
  id: string;
  date: string;
  type: ContactType;
  staffId: string;
  notes: string;
  outcome: string;
  nextStep?: string;
  nextFollowUpDate?: string;
}

export interface Donor {
  id: string;
  name: string;
  email: string;
  phone: string;
  churchId?: string;
  givingHistory: {
    date: string;
    amount: number;
    projectId?: string;
    isRecurring: boolean;
  }[];
  relationshipStatus: RelationshipStatus;
  stage: DonorStage;
  assignedStaffId: string;
  lastContactDate?: string;
  nextFollowUpDate?: string;
  interests: string[];
  preferredContactMethod: string;
  tags: string[];
  engagementScore: number; // 0-100
  notes: string;
  lifetimeGiving: number;
  yearsSupported: number;
  isRecurring: boolean;
  recurringAmount?: number;
  recurringCadence?: 'monthly' | 'quarterly';
  cardExpiry?: string;
}

export interface Church {
  id: string;
  name: string;
  pastor: string;
  address: string;
  phone: string;
  email: string;
  denomination: string;
  relationshipStatus: RelationshipStatus;
  engagementScore: number;
  assignedStaffId: string;
  visitHistory: {
    date: string;
    visitorId: string;
    purpose: string;
    outcome: string;
    notes: string;
  }[];
  nextVisitDate?: string;
  totalGiving: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  goal: string;
  budgetNeeded: number;
  currentFunding: number;
  startDate: string;
  endDate?: string;
  status: ProjectStatus;
  assignedStaffIds: string[];
  tags: string[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  relatedToId?: string; // Donor, Church, or Project ID
  relatedToType?: 'donor' | 'church' | 'project';
  dueDate: string;
  priority: Priority;
  status: TaskStatus;
  completedDate?: string;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface Resource {
  id: string;
  title: string;
  category: string;
  quantityAvailable: number;
  quantitySold: number;
  quantityGiven: number;
  price?: number;
  location: string;
}

export interface BudgetEntry {
  id: string;
  category: 'General' | 'Projects' | 'Events' | 'Travel' | 'Resources' | 'Staff' | 'Media';
  name: string;
  needed: number;
  raised: number;
  isProjectBased: boolean;
  projectId?: string;
}
