
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
  invitationStatus?: 'registered' | 'pending' | 'none';
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
  destination: string;
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
  checkOutPhotos?: string[];
  approvalDecision?: 'approved' | 'rejected' | null;
  approvalTimestamp?: string;
  approvalNotes?: string;
  rejectionReason?: string;
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
  title: string;
  description?: string;
  accessCode: string;
  qrCode: string;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  companyId: string;
  settings: {
    autoApproval: boolean;
    maxUses: number;
    allowGuests: boolean;
    requireApproval: boolean;
  };
  schedule: {
    startDate: Date;
    endDate: Date;
    startTime: string;
    endTime: string;
    recurrence: 'none' | 'daily' | 'weekly' | 'monthly';
  };
  status: 'active' | 'expired' | 'cancelled';
  usageCount: number;
  invitedEmails: Array<{
    email: string;
    sentAt: Date;
    status: 'sent' | 'opened' | 'redeemed';
  }>;
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
