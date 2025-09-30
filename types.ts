
export enum UserRole {
  ADMIN = 'admin',
  RECEPTION = 'reception',
  HOST = 'host',
}

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  companyId: string;
  profileImage: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export enum VisitStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  CHECKED_IN = 'checked-in',
  COMPLETED = 'completed',
}

export interface Visit {
  _id: string;
  visitorName: string;
  visitorCompany: string;
  visitorPhoto?: string;
  host: User;
  reason: string;
  status: VisitStatus;
  scheduledDate: string;
  checkInTime?: string;
  checkOutTime?: string;
  companyId: string;
  notes?: string;
  visitorEmail?: string;
  visitorPhone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardStats {
  active: number;
  pending: number;
  approved: number;
  checkedIn: number;
  completed: number;
  totalUsers: number;
  totalHosts: number;
}

export interface ApiError {
  message: string;
  status?: number;
}
