import { User, UserRole, Visit, VisitStatus } from '../types';

// --- FAKE DATABASE ---
// Extend User interface for mock purposes to include password
interface MockUser extends User {
  password?: string;
}

let mockUsers: MockUser[] = [
    {
        _id: '1',
        email: 'admin@securiti.com',
        password: 'password',
        firstName: 'Admin',
        lastName: 'Usuario',
        role: UserRole.ADMIN,
        companyId: 'comp-1',
        profileImage: 'https://i.pravatar.cc/150?u=admin@securiti.com',
    },
    {
        _id: '2',
        email: 'reception@securiti.com',
        password: 'password',
        firstName: 'Recepcionista',
        lastName: 'Principal',
        role: UserRole.RECEPTION,
        companyId: 'comp-1',
        profileImage: 'https://i.pravatar.cc/150?u=reception@securiti.com',
    },
    {
        _id: '3',
        email: 'host1@securiti.com',
        password: 'password',
        firstName: 'Juan',
        lastName: 'Pérez',
        role: UserRole.HOST,
        companyId: 'comp-1',
        profileImage: 'https://i.pravatar.cc/150?u=host1@securiti.com',
    },
    {
        _id: '4',
        email: 'host2@securiti.com',
        password: 'password',
        firstName: 'Ana',
        lastName: 'García',
        role: UserRole.HOST,
        companyId: 'comp-1',
        profileImage: 'https://i.pravatar.cc/150?u=host2@securiti.com',
    }
];

let mockVisits: Visit[] = [
    { _id: 'v1', visitorName: 'Carlos Sánchez', visitorCompany: 'Tech Solutions', visitorPhoto: 'https://i.pravatar.cc/100?u=v1', host: mockUsers[2], reason: 'Reunión de Proyecto', status: VisitStatus.CHECKED_IN, scheduledDate: new Date(Date.now() - 3600 * 1000).toISOString(), checkInTime: new Date().toLocaleTimeString() },
    { _id: 'v2', visitorName: 'Laura Martínez', visitorCompany: 'Innovate Corp', visitorPhoto: 'https://i.pravatar.cc/100?u=v2', host: mockUsers[3], reason: 'Demostración de Producto', status: VisitStatus.APPROVED, scheduledDate: new Date(Date.now() + 3600 * 2000).toISOString() },
    { _id: 'v3', visitorName: 'Pedro Gómez', visitorCompany: 'Global Web', visitorPhoto: 'https://i.pravatar.cc/100?u=v3', host: mockUsers[2], reason: 'Entrevista de Trabajo', status: VisitStatus.PENDING, scheduledDate: new Date(Date.now() + 3600 * 4000).toISOString() },
    { _id: 'v4', visitorName: 'Sofía López', visitorCompany: 'Marketing Digital', visitorPhoto: 'https://i.pravatar.cc/100?u=v4', host: mockUsers[3], reason: 'Auditoría', status: VisitStatus.COMPLETED, scheduledDate: new Date(Date.now() - 3600 * 24 * 1000).toISOString(), checkInTime: 'Ayer 10:00 AM', checkOutTime: 'Ayer 11:30 AM' },
    { _id: 'v5', visitorName: 'Miguel Fernandez', visitorCompany: 'Consultores Asociados', visitorPhoto: 'https://i.pravatar.cc/100?u=v5', host: mockUsers[2], reason: 'Consulta Técnica', status: VisitStatus.PENDING, scheduledDate: new Date(Date.now() + 3600 * 5000).toISOString() },
];


// --- SIMULATED NETWORK DELAY ---
const FAKE_DELAY = 500; // 0.5 seconds

const simulateRequest = <T>(data: T, shouldFail: boolean = false): Promise<T> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (shouldFail) {
                reject({ message: 'Error de red simulado.' });
            } else {
                // Devuelve una copia profunda para prevenir la mutación directa de la "base de datos"
                resolve(JSON.parse(JSON.stringify(data)));
            }
        }, FAKE_DELAY);
    });
};

// --- API FUNCTIONS ---
const FAKE_TOKEN_PREFIX = "fake-jwt-token-for-user-";

export const login = async (email: string, password: string): Promise<{ token: string; user: User }> => {
    console.log(`Intentando login simulado para: ${email}`);
    const user = mockUsers.find(u => u.email === email && u.password === password);
    
    if (user) {
        const token = `${FAKE_TOKEN_PREFIX}${user._id}`;
        const { password, ...userToReturn } = user;
        return simulateRequest({ token, user: userToReturn });
    } else {
        return Promise.reject({ message: 'Credenciales inválidas' });
    }
};

export const getMe = async (): Promise<User> => {
    console.log('Intentando getMe simulado');
    const token = localStorage.getItem('securitiToken');
    if (token && token.startsWith(FAKE_TOKEN_PREFIX)) {
        const userId = token.replace(FAKE_TOKEN_PREFIX, '');
        const user = mockUsers.find(u => u._id === userId);
        if(user) {
            const { password, ...userToReturn } = user;
            return simulateRequest(userToReturn);
        }
    }
    return Promise.reject({ message: 'Token inválido o expirado' });
};

export const getVisits = async (): Promise<Visit[]> => {
    return simulateRequest(mockVisits.sort((a,b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()));
};

export const createVisit = async (visitData: { visitorName: string; visitorCompany: string; reason: string; hostId: string; scheduledDate: string; }): Promise<Visit> => {
    const host = mockUsers.find(u => u._id === visitData.hostId);
    if (!host) return Promise.reject({ message: "Anfitrión no encontrado" });

    const newVisit: Visit = {
        _id: `v${Date.now()}`,
        status: VisitStatus.PENDING,
        ...visitData,
        host,
    };
    mockVisits.push(newVisit);
    return simulateRequest(newVisit);
};

export const selfRegisterVisit = async (visitData: { visitorName: string; visitorCompany: string; reason: string; hostId: string; visitorPhoto: string; }): Promise<Visit> => {
    const host = mockUsers.find(u => u._id === visitData.hostId);
    if (!host) return Promise.reject({ message: "Anfitrión no encontrado" });

    const newVisit: Visit = {
        _id: `v${Date.now()}`,
        status: VisitStatus.PENDING,
        scheduledDate: new Date().toISOString(),
        ...visitData,
        host,
    };
    mockVisits.push(newVisit);
    return simulateRequest(newVisit);
};


export const updateVisitStatus = async (visitId: string, status: VisitStatus): Promise<Visit> => {
    const visitIndex = mockVisits.findIndex(v => v._id === visitId);
    if (visitIndex > -1) {
        mockVisits[visitIndex].status = status;
        if (status === VisitStatus.CHECKED_IN) {
            mockVisits[visitIndex].checkInTime = new Date().toLocaleString();
        }
        if (status === VisitStatus.COMPLETED) {
            mockVisits[visitIndex].checkOutTime = new Date().toLocaleString();
        }
        return simulateRequest(mockVisits[visitIndex]);
    }
    return Promise.reject({ message: "Visita no encontrada" });
};

export const getUsers = async (): Promise<User[]> => {
    const usersToReturn = mockUsers.map(u => {
        const { password, ...user } = u;
        return user;
    });
    return simulateRequest(usersToReturn);
};

export const getHosts = async (): Promise<User[]> => {
    const hosts = mockUsers.filter(u => u.role === UserRole.HOST).map(u => {
        const { password, ...user } = u;
        return user;
    });
    return simulateRequest(hosts);
};

export const getDashboardStats = async (): Promise<{active: number, pending: number, approved: number}> => {
    const stats = {
        active: mockVisits.filter(v => v.status === VisitStatus.CHECKED_IN).length,
        pending: mockVisits.filter(v => v.status === VisitStatus.PENDING).length,
        approved: mockVisits.filter(v => v.status === VisitStatus.APPROVED).length,
    };
    return simulateRequest(stats);
};