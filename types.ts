
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
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
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
  visitType?: 'spontaneous' | 'pre-registered' | 'access-code';
  accessCode?: string;
  accessId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Company {
  _id: string;
  name: string;
  logo?: string;
  settings: {
    autoApproval: boolean;
    requirePhoto: boolean;
    enableSelfRegister: boolean;
    notificationEmail?: string;
  };
  qrCode: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Blacklist {
  _id: string;
  identifier: string;
  identifierType: 'document' | 'phone' | 'email';
  reason: string;
  notes?: string;
  createdBy: string;
  companyId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BlacklistEntry {
  _id: string;
  identifier: string;
  identifierType: 'document' | 'phone' | 'email';
  reason: string;
  notes?: string;
  createdBy: string;
  companyId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Access {
  _id: string;
  code: string;
  type: 'single-use' | 'time-limited' | 'scheduled';
  expiresAt?: Date;
  scheduledDate?: Date;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  maxUses?: number;
  currentUses: number;
  eventName?: string;
  eventDescription?: string;
  isActive: boolean;
  createdBy: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}export interface DashboardStats {
  active: number;
  pending: number;
  approved: number;
  checkedIn: number;
  completed: number;
  totalUsers: number;
  totalHosts: number;
  rejected?: number;
  cancelled?: number;
}

export interface ApiError {
  message: string;
  status?: number;
}
