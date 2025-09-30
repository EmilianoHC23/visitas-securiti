import { User, Visit, VisitStatus } from '../types';

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
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        message: 'Error de conexión con el servidor' 
      }));
      throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
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