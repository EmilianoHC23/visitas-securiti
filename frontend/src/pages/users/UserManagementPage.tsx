import React, { useState, useEffect } from 'react';
import { LogoutIcon, SettingsIcon } from '../../components/common/icons';
import { User, UserRole } from '../../types';
import * as api from '../../services/api';

interface NewUserData {
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
}

interface EditUserData {
    firstName: string;
    lastName: string;
    role: UserRole;
    email: string;
}

const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => {
    const roleStyles: Record<UserRole, string> = {
        [UserRole.ADMIN]: 'bg-red-100 text-red-800',
        [UserRole.RECEPTION]: 'bg-blue-100 text-blue-800',
        [UserRole.HOST]: 'bg-green-100 text-green-800',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleStyles[role]}`}>{role.charAt(0).toUpperCase() + role.slice(1)}</span>
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const statusStyles: Record<string, string> = {
        'registered': 'bg-green-100 text-green-800',
        'pending': 'bg-yellow-100 text-yellow-800',
        'none': 'bg-gray-100 text-gray-800',
    };
    const statusLabels: Record<string, string> = {
        'registered': 'Registrado',
        'pending': 'Pendiente',
        'none': 'Sin Invitar',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusStyles[status] || statusStyles.none}`}>{statusLabels[status] || 'Sin Invitar'}</span>
};

const InviteUserModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onInvite: (userData: NewUserData) => void;
    loading: boolean;
}> = ({ isOpen, onClose, onInvite, loading }) => {
    const [formData, setFormData] = useState<NewUserData>({
        email: '',
        firstName: '',
        lastName: '',
        role: UserRole.HOST,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onInvite(formData);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Invitar Nuevo Usuario</h3>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre
                        </label>
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Apellido
                        </label>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Rol
                        </label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value={UserRole.HOST}>Host</option>
                            <option value={UserRole.RECEPTION}>Recepcionista</option>
                            <option value={UserRole.ADMIN}>Administrador</option>
                        </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Invitando...' : 'Invitar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const EditUserModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (userData: EditUserData) => void;
    loading: boolean;
    user: User | null;
}> = ({ isOpen, onClose, onUpdate, loading, user }) => {
    const [formData, setFormData] = useState<EditUserData>({
        firstName: '',
        lastName: '',
        role: UserRole.HOST,
        email: '',
    });

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                email: user.email,
            });
        }
    }, [user]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdate(formData);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">Editar Usuario</h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre
                        </label>
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Apellido
                        </label>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Correo Electrónico
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Rol
                        </label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value={UserRole.HOST}>Host</option>
                            <option value={UserRole.RECEPTION}>Recepcionista</option>
                            <option value={UserRole.ADMIN}>Administrador</option>
                        </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Actualizando...' : 'Actualizar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const UserManagementPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [inviteLoading, setInviteLoading] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const usersData = await api.getUsers();
            setUsers(usersData);
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleInviteUser = async (userData: NewUserData) => {
        try {
            setInviteLoading(true);
            await api.sendInvitation({
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                role: userData.role
            });
            setIsModalOpen(false);
            // Refrescar la lista de usuarios para mostrar el nuevo usuario invitado
            await fetchUsers();
            alert('Invitación enviada exitosamente. El usuario aparecerá en la tabla con estatus "Pendiente".');
        } catch (error) {
            console.error('Error sending invitation:', error);
            alert('Error al enviar invitación. Revisa la consola para más detalles.');
        } finally {
            setInviteLoading(false);
        }
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setIsEditModalOpen(true);
    };

    const handleUpdateUser = async (userData: EditUserData) => {
        if (!editingUser) return;

        try {
            setEditLoading(true);
            const updatedUser = await api.updateUser(editingUser._id, userData);
            setUsers(prev => prev.map(user => 
                user._id === editingUser._id ? updatedUser : user
            ));
            setIsEditModalOpen(false);
            setEditingUser(null);
            alert('Usuario actualizado exitosamente');
        } catch (error) {
            console.error('Error updating user:', error);
            alert('Error al actualizar usuario');
        } finally {
            setEditLoading(false);
        }
    };

    const handleResendInvitation = async (userId: string) => {
        if (!confirm('¿Estás seguro de que quieres reenviar la invitación a este usuario?')) {
            return;
        }

        try {
            await api.resendInvitation(userId);
            alert('Invitación reenviada exitosamente');
        } catch (error) {
            console.error('Error resending invitation:', error);
            alert('Error al reenviar invitación');
        }
    };

    const handleDeleteUser = async (user: User) => {
        let message = '';
        let forceDelete = false;

        if (user.invitationStatus === 'pending' || user.invitationStatus === 'none') {
            message = '¿Estás seguro de que quieres eliminar esta invitación? El usuario será eliminado permanentemente y podrás reutilizar este correo.';
        } else if (user.invitationStatus === 'registered') {
            message = '¿Quieres desactivar este usuario o eliminarlo completamente del sistema?\n\n- Desactivar: El usuario quedará inactivo pero podrá ser reactivado\n- Eliminar: El usuario será removido permanentemente del sistema';
            
            const choice = confirm(message + '\n\nPresiona Aceptar para DESACTIVAR o Cancelar para ELIMINAR COMPLETAMENTE');
            if (choice) {
                // Desactivar (comportamiento actual)
                message = '¿Estás seguro de que quieres desactivar este usuario?';
            } else {
                // Eliminar completamente
                forceDelete = true;
                message = '¿Estás seguro de que quieres eliminar completamente este usuario del sistema? Esta acción no se puede deshacer.';
            }
        }
        
        if (!confirm(message)) {
            return;
        }

        try {
            if (user.invitationStatus === 'pending' || user.invitationStatus === 'none') {
                await api.deleteInvitation(user._id);
                alert('Invitación eliminada exitosamente. Puedes reutilizar este correo para invitar a un nuevo usuario.');
            } else {
                await api.deactivateUser(user._id, forceDelete);
                if (forceDelete) {
                    alert('Usuario eliminado completamente del sistema.');
                } else {
                    alert('Usuario desactivado exitosamente.');
                }
            }
            // Recargar la lista de usuarios
            fetchUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            alert(`Error al eliminar usuario: ${errorMessage}`);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Gestión de Usuarios</h2>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 transition-colors"
                >
                    Invitar Usuario
                </button>
            </div>
            
            <div className="overflow-x-auto">
                {loading ? (
                     <div className="text-center p-8">Cargando usuarios...</div>
                ) : (
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Foto</th>
                                <th scope="col" className="px-6 py-3">Nombre</th>
                                <th scope="col" className="px-6 py-3">Email</th>
                                <th scope="col" className="px-6 py-3">Rol</th>
                                <th scope="col" className="px-6 py-3">Estatus</th>
                                <th scope="col" className="px-6 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user._id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <img src={user.profileImage} alt={`${user.firstName} ${user.lastName}`} className="w-10 h-10 rounded-full" />
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                        {user.firstName} {user.lastName}
                                    </td>
                                    <td className="px-6 py-4">{user.email}</td>
                                    <td className="px-6 py-4">
                                        <RoleBadge role={user.role} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={user.invitationStatus || 'none'} />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end space-x-2">
                                            {user.invitationStatus === 'pending' && (
                                                <button 
                                                    onClick={() => handleResendInvitation(user._id)}
                                                    className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded hover:bg-blue-200 flex items-center gap-1"
                                                    title="Reenviar invitación"
                                                >
                                                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a3 3 0 003.22 0L22 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                                    Reenviar
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => handleEditUser(user)}
                                                className="px-3 py-1 text-xs font-medium text-green-600 bg-green-100 rounded hover:bg-green-200 flex items-center gap-1"
                                                title="Editar usuario"
                                            >
                                                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-4.243 1.414a1 1 0 01-1.263-1.263l1.414-4.243a4 4 0 01.828-1.414z" /></svg>
                                                Editar
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteUser(user)}
                                                className="px-3 py-1 text-xs font-medium text-red-600 bg-red-100 rounded hover:bg-red-200 flex items-center gap-1"
                                                title="Eliminar usuario"
                                            >
                                                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                Eliminar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <InviteUserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onInvite={handleInviteUser}
                loading={inviteLoading}
            />

            <EditUserModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingUser(null);
                }}
                onUpdate={handleUpdateUser}
                loading={editLoading}
                user={editingUser}
            />
        </div>
    );
};
