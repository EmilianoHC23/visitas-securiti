// Modal de vista previa de usuario
const UserPreviewModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
}> = ({ isOpen, onClose, user }) => {
    if (!isOpen || !user) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 w-full max-w-2xl mx-4 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
                    title="Cerrar"
                >
                    ✕
                </button>
                <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                    <div className="flex flex-col items-center">
                        <span className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border-4 border-blue-200 mb-4">
                            {user.profileImage && user.profileImage.trim() !== '' ? (
                                <img
                                    src={user.profileImage}
                                    alt={`${user.firstName} ${user.lastName}`}
                                    className="w-32 h-32 object-cover"
                                    onError={e => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const fallback = target.nextElementSibling as HTMLElement;
                                        if (fallback) fallback.style.display = 'inline';
                                    }}
                                />
                            ) : null}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                stroke="currentColor"
                                className="w-20 h-20 text-blue-300"
                                style={{ display: user.profileImage && user.profileImage.trim() !== '' ? 'none' : 'inline' }}
                            >
                                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
                                <path d="M4 20c0-4 4-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" fill="none" />
                            </svg>
                        </span>
                    </div>
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Detalle de usuario</h2>
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-blue-900 mb-2">Datos generales</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-gray-700">
                                <div><span className="font-semibold">Nombre</span><br />{user.firstName}</div>
                                <div><span className="font-semibold">Apellido</span><br />{user.lastName}</div>
                                <div><span className="font-semibold">Correo electrónico</span><br />{user.email}</div>
                                <div><span className="font-semibold">Rol de usuario</span><br /><RoleBadge role={user.role} /></div>
                            </div>
                        </div>
                        {/* Aquí puedes agregar más secciones como permisos, etc. */}
                    </div>
                </div>
            </div>
        </div>
    );
};
import React, { useState, useEffect } from 'react';
import { LogoutIcon, SettingsIcon, UsersIcon } from '../../components/common/icons';
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

    // Estado para la vista previa
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [previewUser, setPreviewUser] = useState<User | null>(null);

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
                if (forceDelete) {
                    await api.deleteUser(user._id);
                    alert('Usuario eliminado completamente del sistema.');
                } else {
                    await api.deactivateUser(user._id);
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
                                <tr
                                    key={user._id}
                                    className="bg-white border-b cursor-pointer group"
                                    onClick={e => {
                                        // Evitar que los botones de acción abran el modal
                                        if ((e.target as HTMLElement).closest('button')) return;
                                        setPreviewUser(user);
                                        setIsPreviewModalOpen(true);
                                    }}
                                >
                                    <td className="px-6 py-4 transition-colors group-hover:bg-blue-100">
                                        <span className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                            {user.profileImage && user.profileImage.trim() !== '' ? (
                                                <img
                                                    src={user.profileImage}
                                                    alt={`${user.firstName} ${user.lastName}`}
                                                    className="w-10 h-10 object-cover"
                                                    onError={e => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.style.display = 'none';
                                                        const fallback = target.nextElementSibling as HTMLElement;
                                                        if (fallback) fallback.style.display = 'inline';
                                                    }}
                                                />
                                            ) : null}
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="currentColor"
                                                viewBox="0 0 24 24"
                                                strokeWidth="1.5"
                                                stroke="currentColor"
                                                className="w-7 h-7 text-gray-400"
                                                style={{ display: user.profileImage && user.profileImage.trim() !== '' ? 'none' : 'inline' }}
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                            </svg>
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap transition-colors group-hover:bg-blue-100">
                                        {user.firstName} {user.lastName}
                                    </td>
                                    <td className="px-6 py-4 transition-colors group-hover:bg-blue-100">{user.email}</td>
                                    <td className="px-6 py-4 transition-colors group-hover:bg-blue-100">
                                        <RoleBadge role={user.role} />
                                    </td>
                                    <td className="px-6 py-4 transition-colors group-hover:bg-blue-100">
                                        <StatusBadge status={user.invitationStatus || 'none'} />
                                    </td>
                                    <td className="px-6 py-4 text-right transition-colors group-hover:bg-blue-100">
                                        <div className="flex justify-end space-x-2">
                                            {user.invitationStatus === 'pending' && (
                                                <button 
                                                    onClick={e => { e.stopPropagation(); handleResendInvitation(user._id); }}
                                                    className="p-2 text-blue-600 hover:text-blue-800 bg-transparent border-none shadow-none"
                                                    title="Reenviar invitación"
                                                    style={{ background: 'none' }}
                                                >
                                                    {/* Heroicons outline: Envelope + Arrow Right (forward email) */}
                                                    <span className="relative inline-block w-5 h-5">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="absolute left-0 top-0 w-5 h-5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-.659 1.591l-7.5 7.5a2.25 2.25 0 01-3.182 0l-7.5-7.5A2.25 2.25 0 012.25 6.993V6.75" />
                                                        </svg>
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="absolute right-0 bottom-0 w-3 h-3">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8m0 0l-3-3m3 3l-3 3" />
                                                        </svg>
                                                    </span>
                                                </button>
                                            )}
                                            <button 
                                                onClick={e => { e.stopPropagation(); handleEditUser(user); }}
                                                className="p-2 text-green-600 hover:text-green-800 bg-transparent border-none shadow-none"
                                                title="Editar usuario"
                                                style={{ background: 'none' }}
                                            >
                                                {/* Heroicons outline: Pencil Square */}
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a2.25 2.25 0 113.182 3.182L7.5 19.313 3 21l1.687-4.5 12.175-13.013z" />
                                                </svg>
                                            </button>
                                            <button 
                                                onClick={e => { e.stopPropagation(); handleDeleteUser(user); }}
                                                className="p-2 text-red-600 hover:text-red-800 bg-transparent border-none shadow-none"
                                                title="Eliminar usuario"
                                                style={{ background: 'none' }}
                                            >
                                                {/* Heroicons outline: X-Mark (tache) */}
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
            {/* Modal de vista previa de usuario */}
            <UserPreviewModal
                isOpen={isPreviewModalOpen}
                onClose={() => setIsPreviewModalOpen(false)}
                user={previewUser}
            />
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
