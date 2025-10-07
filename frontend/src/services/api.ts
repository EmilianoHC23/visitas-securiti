import { User, Visit, VisitStatus, Company, Blacklist, Access } from '../types';

// =================================================================
// CONFIGURACIÓN DE LA API
// =================================================================

const isDevelopment = import.meta.env.VITE_ENVIRONMENT === 'development';
const BASE_URL = isDevelopment 
  ? import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
  : '/api'; // Usar ruta relativa en producción

console.log('🌐 API Base URL:', BASE_URL);
console.log('🌍 Environment:', import.meta.env.VITE_ENVIRONMENT || 'not set');

const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('securitiToken');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    console.log(`🌐 API Request: ${options.method || 'GET'} ${BASE_URL}${endpoint}`);
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    console.log(`📡 API Response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        message: 'Error de conexión con el servidor' 
      }));
      
      console.error(`❌ API Error: ${response.status}`, errorData);
      
      // Create enhanced error object with response details
      const error = new Error(errorData.message || `Error ${response.status}: ${response.statusText}`) as any;
      error.response = {
        status: response.status,
        statusText: response.statusText,
        data: errorData
      };
      
      throw error;
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('API Request Error:', error);
    
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('No se pudo conectar con el servidor. Verifica tu conexión.');
    }
    
    throw error;
  }
};

// --- AUTENTICACIÓN ---
export const login = async (email: string, password: string): Promise<{ token: string; user: User }> => {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
};

export const getMe = async (): Promise<User> => {
  return apiRequest('/auth/me');
};

// --- VISITAS ---
export const getVisits = async (filters?: { 
  status?: VisitStatus; 
  date?: string; 
  hostId?: string; 
}): Promise<Visit[]> => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.date) params.append('date', filters.date);
  if (filters?.hostId) params.append('hostId', filters.hostId);
  
  const queryString = params.toString();
  return apiRequest(`/visits${queryString ? `?${queryString}` : ''}`);
};

export const createVisit = async (visitData: { 
  visitorName: string; 
  visitorCompany: string; 
  reason: string; 
  hostId: string; 
  scheduledDate: string;
  visitorEmail?: string;
  visitorPhone?: string;
}): Promise<Visit> => {
  return apiRequest('/visits', {
    method: 'POST',
    body: JSON.stringify(visitData),
  });
};

export const selfRegisterVisit = async (visitData: { 
  visitorName: string; 
  visitorCompany: string; 
  reason: string; 
  hostId: string; 
  visitorPhoto?: string;
  visitorEmail?: string;
  visitorPhone?: string;
}): Promise<Visit> => {
  return apiRequest('/visits/register', {
    method: 'POST',
    body: JSON.stringify(visitData),
  });
};

export const updateVisitStatus = async (visitId: string, status: VisitStatus): Promise<Visit> => {
  return apiRequest(`/visits/${visitId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
};

export const updateVisit = async (visitId: string, visitData: Partial<Visit>): Promise<Visit> => {
  return apiRequest(`/visits/${visitId}`, {
    method: 'PUT',
    body: JSON.stringify(visitData),
  });
};

export const deleteVisit = async (visitId: string): Promise<void> => {
  return apiRequest(`/visits/${visitId}`, {
    method: 'DELETE',
  });
};

// --- USUARIOS ---
export const getUsers = async (): Promise<User[]> => {
  return apiRequest('/users');
};

export const getHosts = async (): Promise<User[]> => {
  return apiRequest('/users/hosts');
};

export const getHostsPublic = async (): Promise<User[]> => {
  return apiRequest('/users/public/hosts');
};

export const createUser = async (userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
}): Promise<User> => {
  return apiRequest('/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

export const updateUser = async (userId: string, userData: Partial<User>): Promise<User> => {
  return apiRequest(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  });
};

export const deactivateUser = async (userId: string): Promise<void> => {
  return apiRequest(`/users/${userId}`, {
    method: 'DELETE',
  });
};

// --- DASHBOARD ---
export const getDashboardStats = async (): Promise<{
  active: number;
  pending: number;
  approved: number;
  checkedIn: number;
  completed: number;
  totalUsers: number;
  totalHosts: number;
}> => {
  return apiRequest('/dashboard/stats');
};

export const getRecentVisits = async (limit?: number): Promise<Visit[]> => {
  const params = limit ? `?limit=${limit}` : '';
  return apiRequest(`/dashboard/recent-visits${params}`);
};

export const getAnalytics = async (period: 'week' | 'month' = 'week') => {
  return apiRequest(`/dashboard/analytics?period=${period}`);
};

// --- COMPANY MANAGEMENT ---
export const getCompanyConfig = async (): Promise<Company> => {
  return apiRequest('/company/config');
};

export const updateCompanyConfig = async (config: Partial<Company>): Promise<Company> => {
  return apiRequest('/company/config', {
    method: 'PUT',
    body: JSON.stringify(config),
  });
};

export const getCompanyQR = async (): Promise<{ qrCode: string; qrUrl: string; publicUrl: string }> => {
  return apiRequest('/company/qr-code');
};

// --- BLACKLIST MANAGEMENT ---
export const getBlacklist = async (): Promise<Blacklist[]> => {
  return apiRequest('/blacklist');
};

export const addToBlacklist = async (data: {
  email: string;
  name: string;
  reason: string;
}): Promise<Blacklist> => {
  return apiRequest('/blacklist', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const removeFromBlacklist = async (id: string): Promise<void> => {
  return apiRequest(`/blacklist/${id}`, {
    method: 'DELETE',
  });
};

// --- ACCESS CODES / EVENTS ---
export const getAccesses = async (): Promise<Access[]> => {
  return apiRequest('/access');
};

export const createAccess = async (accessData: {
  title: string;
  description?: string;
  schedule: {
    startDate: Date;
    endDate: Date;
    startTime: string;
    endTime: string;
    recurrence?: string;
  };
  settings: {
    maxUses?: number;
    autoApproval?: boolean;
    requireApproval?: boolean;
    allowGuests?: boolean;
  };
  invitedEmails?: string[];
}): Promise<Access> => {
  return apiRequest('/access', {
    method: 'POST',
    body: JSON.stringify(accessData),
  });
};

export const updateAccess = async (id: string, updates: Partial<Access>): Promise<Access> => {
  return apiRequest(`/access/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
};

export const deleteAccess = async (id: string): Promise<void> => {
  return apiRequest(`/access/${id}`, {
    method: 'DELETE',
  });
};

export const updateAccessStatus = async (id: string, status: string): Promise<Access> => {
  return apiRequest(`/access/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
};

export const getPublicAccessInfo = async (accessCode: string) => {
  return apiRequest(`/access/public/${accessCode}`);
};

export const redeemAccessCode = async (accessCode: string, visitorData: {
  name: string;
  company: string;
  email: string;
  phone?: string;
}) => {
  return apiRequest('/access/redeem', {
    method: 'POST',
    body: JSON.stringify({ accessCode, visitorData }),
  });
};

// --- PUBLIC REGISTRATION ---
export const getPublicCompanyInfo = async (qrCode: string) => {
  return apiRequest(`/public/company/${qrCode}`);
};

export const getPublicHosts = async (companyId: string): Promise<User[]> => {
  return apiRequest(`/public/hosts/${companyId}`);
};

export const submitPublicVisit = async (visitData: {
  companyId: string;
  visitorName: string;
  visitorCompany: string;
  visitorEmail: string;
  visitorPhone?: string;
  hostId: string;
  reason: string;
  visitorPhoto?: string;
}) => {
  return apiRequest('/public/visit', {
    method: 'POST',
    body: JSON.stringify(visitData),
  });
};

// --- REPORTS & ANALYTICS ---
export const getAdvancedAnalytics = async (params: {
  period?: string;
  startDate?: string;
  endDate?: string;
} = {}) => {
  const queryParams = new URLSearchParams(params);
  return apiRequest(`/reports/analytics?${queryParams}`);
};

export const exportReports = async (format: 'json' | 'csv', filters: any = {}) => {
  return apiRequest('/reports/export', {
    method: 'POST',
    body: JSON.stringify({ format, filters }),
  });
};

// --- ACCESS CODE REDEMPTION ---
export const getAccessByCode = async (accessCode: string) => {
  return apiRequest(`/access/public/${accessCode}`);
};

// --- INVITATIONS ---
export const sendInvitation = async (invitationData: {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}) => {
  return apiRequest('/invitations', {
    method: 'POST',
    body: JSON.stringify(invitationData),
  });
};

export const verifyInvitationToken = async (token: string) => {
  return apiRequest(`/invitations/verify/${token}`);
};

export const completeRegistration = async (token: string, userData: {
  password: string;
  firstName: string;
  lastName: string;
}) => {
  return apiRequest('/invitations/complete', {
    method: 'POST',
    body: JSON.stringify({ token, ...userData }),
  });
};

export const getInvitations = async () => {
  return apiRequest('/invitations');
};

export const resendInvitation = async (userId: string) => {
  return apiRequest(`/invitations/resend/${userId}`, {
    method: 'POST',
  });
};

// Función de prueba para verificar conectividad
export const testInvitationsEndpoint = async () => {
  return apiRequest('/invitations/test');
};