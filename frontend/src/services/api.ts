// Asignar recurso (tarjeta/acceso) a una visita
export const updateVisitAccess = async (visitId, accessId) => {
  return apiRequest(`/visits/${visitId}/access`, {
    method: 'PUT',
    body: JSON.stringify({ accessId }),
  });
};
// Obtener eventos/accesos para agenda (unificados)
export const getAgendaEvents = async () => {
  // Se puede combinar visitas y accesos si el backend lo soporta, aquí solo ejemplo de accesos
  const accesses = await getAccesses();
  // Si hay endpoint de eventos, se puede agregar aquí
  // const events = await getEvents();
  return { events: accesses };
};
import { User, Visit, VisitStatus, Company, Blacklist, Access } from '../types';

// Eliminar completamente un usuario (force delete)
export const deleteUser = async (userId: string): Promise<void> => {
  return apiRequest(`/users/${userId}?force=true`, {
    method: 'DELETE',
  });
};

// =================================================================
// CONFIGURACIÓN DE LA API
// =================================================================

// Detectar entorno basado en hostname (más confiable que variables de entorno)
const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const BASE_URL = isLocalhost 
  ? (import.meta.env.VITE_API_URL || 'http://localhost:3001/api')
  : '/api'; // En producción, usar ruta relativa

console.log('🌐 API Base URL:', BASE_URL);
console.log('🌍 Environment:', isLocalhost ? 'localhost' : 'production');
console.log('🔗 Current hostname:', typeof window !== 'undefined' ? window.location.hostname : 'SSR');

const apiRequest = async (endpoint: string, options: RequestInit = {}) => { // eslint-disable-line no-undef
  const token = localStorage.getItem('securitiToken');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    console.log(`🌐 API Request: ${options.method || 'GET'} ${BASE_URL}${endpoint}`);
    if (options.body) {
      console.log('📦 Request body:', options.body);
    }
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
export const login = async (username: string, password: string): Promise<{ token: string; user: User }> => {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password, email: username }),
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
  limit?: number;
  page?: number;
}): Promise<{ visits: Visit[]; meta: any }> => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.hostId) params.append('hostId', filters.hostId);
  
  const queryString = params.toString();
  return apiRequest(`/visits${queryString ? `?${queryString}` : ''}`);
};

export const createVisit = async (visitData: { 
  visitorName: string; 
  visitorCompany?: string; 
  reason: string; 
  hostId: string; 
  scheduledDate: string;
  destination?: string;
  visitorEmail?: string;
  visitorPhone?: string;
  visitorPhoto?: string;
  qrToken?: string;
  visitType?: 'spontaneous' | 'pre-registered' | 'access-code';
  accessCode?: string;
  fromAccessEvent?: boolean;
}): Promise<Visit> => {
  return apiRequest('/visits', {
    method: 'POST',
    body: JSON.stringify(visitData),
  });
};

export const selfRegisterVisit = async (visitData: { 
  visitorName: string; 
  visitorCompany?: string; 
  reason: string; 
  hostId: string; 
  destination?: string;
  visitorPhoto?: string;
  visitorEmail?: string;
  visitorPhone?: string;
}): Promise<Visit> => {
  return apiRequest('/visits/register', {
    method: 'POST',
    body: JSON.stringify(visitData),
  });
};

export const updateVisitStatus = async (visitId: string, status: VisitStatus, reason?: string): Promise<Visit> => {
  const body: any = { status };
  if (reason) body.reason = reason;
  return apiRequest(`/visits/${visitId}/status`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
};

export const updateVisit = async (visitId: string, visitData: Partial<Visit>): Promise<Visit> => {
  return apiRequest(`/visits/${visitId}`, {
    method: 'PUT',
    body: JSON.stringify(visitData),
  });
};

// Convenience helpers for explicit actions used by some views
export const approveVisit = async (visitId: string): Promise<Visit> => {
  return updateVisitStatus(visitId, VisitStatus.APPROVED);
};

export const rejectVisit = async (visitId: string): Promise<Visit> => {
  return updateVisitStatus(visitId, VisitStatus.REJECTED);
};

// New visit APIs
export const getVisitStatus = async (visitId: string): Promise<{ status: string; mapped: string }> => {
  return apiRequest(`/visits/status/${visitId}`);
};

export const checkInVisit = async (visitId: string, assignedResource?: string): Promise<Visit> => {
  return apiRequest(`/visits/checkin/${visitId}`, { 
    method: 'POST',
    body: JSON.stringify({ assignedResource })
  });
};

export const checkOutVisit = async (visitId: string, photos: string[] = []): Promise<{ visit: Visit; elapsedMs: number | null }> => {
  return apiRequest(`/visits/checkout/${visitId}`, { method: 'POST', body: JSON.stringify({ photos }) });
};

export const checkoutWithQR = async (qrToken: string): Promise<{ message: string; visit: Visit }> => {
  return apiRequest('/visits/scan-qr', { method: 'POST', body: JSON.stringify({ qrToken }) });
};

export const getAgenda = async (params: { from?: string; to?: string; hostId?: string; q?: string } = {}) => {
  const query = new URLSearchParams(params as any).toString();
  return apiRequest(`/visits/agenda${query ? `?${query}` : ''}`);
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

export const uploadCompanyLogo = async (file: File): Promise<{ logoUrl: string; filename: string }> => {
  const formData = new FormData();
  formData.append('logo', file);

  const token = localStorage.getItem('token');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  const response = await fetch(`${API_URL}/company/upload-logo`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al subir el logo');
  }

  return response.json();
};

export const getCompanyQR = async (): Promise<{ qrCode: string; qrUrl: string; publicUrl: string }> => {
  return apiRequest('/company/qr-code');
};

// Get public company configuration (no auth required)
export const getPublicCompanyConfig = async (): Promise<{ name: string; logo?: string; address?: string; email?: string; phone?: string }> => {
  return apiRequest('/company/public-config');
};

// Obtener accesos activos públicos (sin autenticación)
export const getActiveAccesses = async (): Promise<Access[]> => {
  return apiRequest('/access/public/active');
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
export const getAccesses = async (status?: string): Promise<Access[]> => {
  const query = status ? `?status=${status}` : '';
  return apiRequest(`/access${query}`);
};

export const getAccessById = async (id: string): Promise<Access> => {
  return apiRequest(`/access/${id}`);
};

export const getAccessesForAgenda = async (start?: string, end?: string): Promise<Access[]> => {
  const query = start && end ? `?start=${start}&end=${end}` : '';
  return apiRequest(`/access/agenda${query}`);
};

export const createAccess = async (accessData: {
  eventName: string;
  type: 'reunion' | 'proyecto' | 'evento' | 'visita' | 'otro';
  startDate: Date | string;
  endDate: Date | string;
  location?: string;
  eventImage?: string;
  invitedUsers?: Array<{
    name: string;
    email?: string;
    phone?: string;
    company?: string;
  }>;
  notifyUsers?: string[];
  settings?: {
    sendAccessByEmail?: boolean;
    language?: 'es' | 'en';
    noExpiration?: boolean;
    enablePreRegistration?: boolean;
  };
  additionalInfo?: string;
}): Promise<Access> => {
  return apiRequest('/access', {
    method: 'POST',
    body: JSON.stringify(accessData),
  });
};

export const updateAccess = async (id: string, updates: {
  endDate?: Date | string;
  eventImage?: string;
  invitedUsers?: Array<{
    name: string;
    email?: string;
    phone?: string;
    company?: string;
  }>;
  additionalInfo?: string;
}): Promise<Access> => {
  return apiRequest(`/access/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
};

export const cancelAccess = async (id: string): Promise<void> => {
  return apiRequest(`/access/${id}`, {
    method: 'DELETE',
  });
};

export const checkInAccess = async (accessCode: string, guestData: {
  guestEmail?: string;
  guestPhone?: string;
  guestName: string;
}): Promise<any> => {
  return apiRequest(`/access/check-in/${accessCode}`, {
    method: 'POST',
    body: JSON.stringify(guestData),
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
  profileImage?: string;
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
  profileImage?: string;
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

export const deleteInvitation = async (userId: string) => {
  return apiRequest(`/invitations/${userId}`, {
    method: 'DELETE',
  });
};

// Función de prueba para verificar configuración SMTP
export const testSMTPConfig = async () => {
  return apiRequest('/invitations/test-smtp');
};

export const getVisitDetails = async (visitId: string): Promise<{ visit: Visit; events: any[] }> => {
  return apiRequest(`/visits/${visitId}`);
};

// Public access check-in
export const publicAccessCheckIn = async (data: {
  accessCode: string;
  guestEmail?: string;
  guestPhone?: string;
  guestName: string;
}) => {
  return apiRequest('/public/access-check-in', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// Get public info for an access/event (no auth required)
export const getAccessPublicInfo = async (accessId: string) => {
  return apiRequest(`/access/${accessId}/public-info`);
};

// Pre-register for an access/event (no auth required)
export const preRegisterToAccess = async (accessId: string, data: {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  photo?: string;
}) => {
  return apiRequest(`/access/${accessId}/pre-register`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};
