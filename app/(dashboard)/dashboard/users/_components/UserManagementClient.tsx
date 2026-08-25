'use client'

import { useState, useTransition } from 'react'
import { Plus, X, Edit, Trash2, Shield, User, Key, Mail, Lock, Loader2, ShieldCheck } from 'lucide-react'

export const APP_MENUS = [
  { id: 'dashboard', label: 'Dashboard Overview', path: '/dashboard' },
  { id: 'dtsen', label: 'Rekap DTSEN', path: '/dashboard/dtsen', subMenus: [
      { id: 'dtsen_data', label: 'Manajemen Data' },
      { id: 'dtsen_stats', label: 'Analisis Statistik' }
    ]
  },
  { id: 'bansos', label: 'Bantuan Sosial', path: '/dashboard/bantuan-sosial' },
  { id: 'gis', label: 'Peta GIS', path: '/dashboard/gis' },
  { id: 'program', label: 'Program Kegiatan', path: '/dashboard/program', subMenus: [
      { id: 'program_mindmap', label: 'Mind Map' },
      { id: 'program_data', label: 'Data Kegiatan' },
      { id: 'program_settings', label: 'Pengaturan Sumber Data' }
    ]
  },
  { id: 'users', label: 'Manajemen Pengguna', path: '/dashboard/users' },
];
import { addUserAction, updateUserAction, deleteUserAction } from '@/actions/user.actions'

type UserRole = 'user' | 'IAM & ADMIN'
type UserStatus = 'Aktif' | 'Nonaktif'

interface UserData {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  createdAt: string
  permissions?: string[]
}

export default function UserManagementClient({ initialUsers, currentUserRole }: { initialUsers: UserData[], currentUserRole: string }) {
  const [users, setUsers] = useState<UserData[]>(initialUsers)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  
  // Permissions State
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<UserData | null>(null);
  const [tempPermissions, setTempPermissions] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user' as UserRole,
    status: 'Aktif' as UserStatus
  })

  const handleOpenPermissionsModal = (user: UserData) => {
    if (currentUserRole !== 'IAM & ADMIN') {
      alert("Anda tidak memiliki izin untuk melakukan aksi ini");
      return;
    }
    setSelectedUserForPermissions(user);
    setTempPermissions(user.permissions || []);
    setIsPermissionsModalOpen(true);
  };

  const handleClosePermissionsModal = () => {
    setIsPermissionsModalOpen(false);
    setSelectedUserForPermissions(null);
    setTempPermissions([]);
  };

  const handleSavePermissions = () => {
    if (selectedUserForPermissions) {
      setUsers(users.map(u => 
        u.id === selectedUserForPermissions.id 
          ? { ...u, permissions: tempPermissions } 
          : u
      ));
    }
    handleClosePermissionsModal();
  };

  const togglePermission = (menuId: string, isParent: boolean = true, parentId?: string) => {
    setTempPermissions(prev => {
      let newPerms = [...prev];
      if (newPerms.includes(menuId)) {
        newPerms = newPerms.filter(id => id !== menuId);
        if (isParent) {
          const parentMenu = APP_MENUS.find(m => m.id === menuId);
          if (parentMenu?.subMenus) {
            const childIds = parentMenu.subMenus.map(sub => sub.id);
            newPerms = newPerms.filter(id => !childIds.includes(id));
          }
        }
      } else {
        newPerms.push(menuId);
        if (isParent) {
          const parentMenu = APP_MENUS.find(m => m.id === menuId);
          if (parentMenu?.subMenus) {
            parentMenu.subMenus.forEach(sub => {
              if (!newPerms.includes(sub.id)) {
                newPerms.push(sub.id);
              }
            });
          }
        }
        if (!isParent && parentId && !newPerms.includes(parentId)) {
          newPerms.push(parentId);
        }
      }
      return newPerms;
    });
  };

  const handleSelectAllPermissions = () => {
    const allPerms: string[] = [];
    APP_MENUS.forEach(menu => {
      allPerms.push(menu.id);
      if (menu.subMenus) {
        menu.subMenus.forEach(sub => allPerms.push(sub.id));
      }
    });
    setTempPermissions(allPerms);
  };

  const handleViewOnlyPermissions = () => {
    const viewOnlyPerms = ['dashboard', 'dtsen', 'dtsen_stats', 'bansos', 'gis', 'program', 'program_mindmap', 'program_data'];
    setTempPermissions(viewOnlyPerms);
  };

  const handleResetPermissions = () => {
    setTempPermissions([]);
  };

  const handleOpenModal = (user?: UserData) => {
    if (currentUserRole !== 'IAM & ADMIN') {
      alert("Anda tidak memiliki izin untuk melakukan aksi ini");
      return;
    }
    if (user) {
      setEditingUserId(user.id)
      setFormData({
        name: user.name,
        email: user.email,
        password: '', // Leave blank unless changing
        role: user.role,
        status: user.status
      })
    } else {
      setEditingUserId(null)
      setFormData({ name: '', email: '', password: '', role: 'user', status: 'Aktif' })
    }
    setIsModalOpen(true)
  }
  
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingUserId(null)
    setFormData({ name: '', email: '', password: '', role: 'user', status: 'Aktif' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (currentUserRole !== 'IAM & ADMIN') {
      alert("Anda tidak memiliki izin untuk melakukan aksi ini");
      return;
    }

    startTransition(async () => {
      try {
        if (editingUserId) {
          // Edit existing user
          await updateUserAction(editingUserId, formData)
          // Optimistic local update (optional, since revalidatePath will refresh, but good for UX)
          setUsers(users.map(u => u.id === editingUserId ? {
            ...u,
            name: formData.name,
            email: formData.email,
            role: formData.role,
            status: formData.status
          } : u))
        } else {
          // Add new user
          await addUserAction(formData)
          // We won't optimistically add here because the server dictates the new ID,
          // but revalidatePath will trigger a server re-render bringing in the new data.
        }
        handleCloseModal()
      } catch (error: any) {
        alert(error.message || "Terjadi kesalahan")
      }
    })
  }

  const handleDelete = async (id: string) => {
    if (currentUserRole !== 'IAM & ADMIN') {
      alert("Anda tidak memiliki izin untuk melakukan aksi ini");
      return;
    }
    
    if (window.confirm("Apakah Anda yakin ingin menghapus pengguna ini?")) {
      startTransition(async () => {
        try {
          await deleteUserAction(id)
          setUsers(users.filter(u => u.id !== id))
        } catch (error: any) {
          alert(error.message || "Terjadi kesalahan")
        }
      })
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header Bar */}
      <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
        <h3 className="font-semibold text-gray-800">Daftar Pengguna Sistem</h3>
        {currentUserRole === 'IAM & ADMIN' && (
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm shadow-sm"
          >
            <Plus size={16} />
            Tambah Pengguna
          </button>
        )}
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-100 text-gray-700 text-xs uppercase font-semibold">
            <tr>
              <th className="px-6 py-4 rounded-tl-lg">Nama Lengkap</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Peran</th>
              <th className="px-6 py-4">Status</th>
              {currentUserRole === 'IAM & ADMIN' && (
                <th className="px-6 py-4 text-center rounded-tr-lg">Aksi</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{user.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Terdaftar: {user.createdAt}</div>
                </td>
                <td className="px-6 py-4">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
                    ${user.role === 'IAM & ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' : 
                      'bg-gray-100 text-gray-700 border-gray-200'}
                  `}>
                    {user.role === 'IAM & ADMIN' ? <Shield size={12} /> : <User size={12} />}
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                    ${user.status === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}
                  `}>
                    <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Aktif' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    {user.status}
                  </span>
                </td>
                {currentUserRole === 'IAM & ADMIN' && (
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <button 
                        onClick={() => handleOpenPermissionsModal(user)}
                        className="text-gray-400 hover:text-green-600 transition-colors" 
                        title="Kelola Hak Akses"
                      >
                        <ShieldCheck size={16} />
                      </button>
                      <button 
                        onClick={() => handleOpenModal(user)}
                        className="text-gray-400 hover:text-blue-600 transition-colors" 
                        title="Edit Pengguna"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        disabled={isPending}
                        onClick={() => handleDelete(user.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50" 
                        title="Hapus Pengguna"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  Belum ada data pengguna.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h3 className="font-semibold text-lg text-gray-900">
                {editingUserId ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
              </h3>
              <button 
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-5">
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <User size={14} className="text-gray-400" />
                  Nama Lengkap
                </label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
                  placeholder="Masukkan nama lengkap"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Mail size={14} className="text-gray-400" />
                  Email
                </label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
                  placeholder="admin@contoh.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Key size={14} className="text-gray-400" />
                  Kata Sandi
                </label>
                <input 
                  type="password" 
                  required={!editingUserId}
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
                  placeholder={editingUserId ? "Kosongkan jika tidak ingin mengubah" : "Minimal 8 karakter"}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Shield size={14} className="text-gray-400" />
                  Peran Akses
                </label>
                <select 
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm appearance-none bg-white transition-all"
                >
                  <option value="user">user</option>
                  <option value="IAM & ADMIN">IAM & ADMIN</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full border border-gray-400 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                  </span>
                  Status Akun
                </label>
                <select 
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value as UserStatus})}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm appearance-none bg-white transition-all"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-gray-100 mt-2">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isPending}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {isPending && <Loader2 size={16} className="animate-spin" />}
                  {editingUserId ? 'Simpan Perubahan' : 'Simpan Pengguna'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {isPermissionsModalOpen && selectedUserForPermissions && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            <div className="flex justify-between items-center p-5 border-b border-gray-100 shrink-0">
              <h3 className="font-semibold text-lg text-gray-900">
                Pengaturan Hak Akses Menu - {selectedUserForPermissions.name}
              </h3>
              <button 
                onClick={handleClosePermissionsModal}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1">
              <div className="flex gap-2 mb-6 flex-wrap">
                <button
                  onClick={handleSelectAllPermissions}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-full font-medium transition-colors shadow-sm border border-gray-200"
                >
                  Pilih Semua (Full Access)
                </button>
                <button
                  onClick={handleViewOnlyPermissions}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm rounded-full font-medium transition-colors shadow-sm border border-blue-100"
                >
                  Hanya Lihat (View Only)
                </button>
                <button
                  onClick={handleResetPermissions}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-sm rounded-full font-medium transition-colors shadow-sm border border-red-100"
                >
                  Reset
                </button>
              </div>

              <div className="space-y-4">
                {APP_MENUS.map(menu => {
                  const isMenuChecked = tempPermissions.includes(menu.id);
                  return (
                    <div key={menu.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50/50">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isMenuChecked}
                          onChange={() => togglePermission(menu.id, true)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="font-medium text-gray-800">{menu.label}</span>
                      </label>
                      
                      {menu.subMenus && (
                        <div className="mt-3 ml-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {menu.subMenus.map(sub => (
                            <label key={sub.id} className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={tempPermissions.includes(sub.id)}
                                onChange={() => togglePermission(sub.id, false, menu.id)}
                                disabled={!isMenuChecked}
                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50"
                              />
                              <span className={`text-sm ${isMenuChecked ? 'text-gray-600' : 'text-gray-400'}`}>
                                {sub.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 shrink-0 flex justify-end gap-3 bg-white">
              <button 
                onClick={handleClosePermissionsModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleSavePermissions}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
              >
                Simpan Perubahan Hak Akses
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
