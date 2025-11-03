
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
  assignedResource?: string;
  rejectionReason?: string;
  qrToken?: string;
  destination?: string;
  approvedAt?: string;
  rejectedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Company {
  _id: string;
  name: string;
  logo?: string;
  location?: {
    street?: string;
    colony?: string;
    postalCode?: string;
    city?: string;
    state?: string;
    country?: string;
    googleMapsUrl?: string;
    photo?: string;
    arrivalInstructions?: string;
  };
  settings: {
    autoApproval: boolean;
    autoCheckIn: boolean;
    autoCheckout?: boolean;
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
  visitorName: string;
  photo?: string;
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
  visitorName: string;
  photo?: string;
  createdBy: string;
  companyId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InvitedUser {
  name: string;
  email: string;
  phone: string;
  company: string;
  qrCode?: string;
  attendanceStatus: 'pendiente' | 'asistio' | 'no-asistio';
  checkInTime?: Date;
  addedViaPreRegistration?: boolean;
}

export interface Access {
  _id: string;
  eventName: string;
  type: 'reunion' | 'proyecto' | 'evento' | 'visita' | 'otro';
  accessCode: string;
  creatorId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  companyId: string;
  startDate: Date | string;
  endDate: Date | string;
  eventImage?: string;
  location?: string;
  settings: {
    sendAccessByEmail: boolean;
    language: 'es' | 'en';
    noExpiration: boolean;
    enablePreRegistration?: boolean;
  };
  status: 'active' | 'expired' | 'cancelled' | 'finalized';
  reminderSent: boolean;
  notifyUsers: string[];
  invitedUsers: InvitedUser[];
  additionalInfo?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface DashboardStats {
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
