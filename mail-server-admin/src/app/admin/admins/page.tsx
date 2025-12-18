'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../utils/apiClient';
import Modal from '../../components/Modal';

interface Admin {
  _id: number | string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminsManagement() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    username: '',
    email: '',
    password: '',
    role: 'admin'
  });
  const router = useRouter();

  // Fetch admins
  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError(null);
      
      const response = await apiClient.post(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/admins`, newAdmin);
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create admin');
      }
      
      // Use toast notification
      (window as any).addToast('Admin created successfully', 'success');
      setNewAdmin({ username: '', email: '', password: '', role: 'admin' });
      setShowCreateForm(false);
      
      // Refresh admins list
      fetchAdmins();
    } catch (err: any) {
      (window as any).addToast(err.message || 'Failed to create admin', 'error');
      console.error(err);
    }
  };

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin-auth/profile`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch admins');
      }
      
      // For now, we'll just show a message that this feature is being developed
      setAdmins([]);
    } catch (err) {
      (window as any).addToast('Failed to load admins', 'error');
      console.error('Error fetching admins:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateAdminRole = async (adminId: number | string, newRole: string) => {
    // This would be implemented if we had a proper endpoint
    (window as any).addToast('Admin role update not implemented yet', 'info');
  };

  const deactivateAdmin = async (adminId: number | string) => {
    // This would be implemented if we had a proper endpoint
    (window as any).addToast('Admin deactivation not implemented yet', 'info');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-foreground"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Create Admin Modal */}
      <Modal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        title="Create New Admin"
        size="lg"
      >
        <form onSubmit={handleCreateAdmin} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">Username</label>
              <input
                type="text"
                value={newAdmin.username}
                onChange={(e) => setNewAdmin({...newAdmin, username: e.target.value})}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground transition-all duration-200"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">Email</label>
              <input
                type="email"
                value={newAdmin.email}
                onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground transition-all duration-200"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">Password</label>
              <input
                type="password"
                value={newAdmin.password}
                onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground transition-all duration-200"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">Role</label>
              <select
                value={newAdmin.role}
                onChange={(e) => setNewAdmin({...newAdmin, role: e.target.value})}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground transition-all duration-200"
              >
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button 
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 transform hover:scale-105"
            >
              Create Admin
            </button>
            <button 
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-accent transition-all duration-200 text-foreground transform hover:scale-105"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fadeInSlideDown">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Management</h1>
          <p className="text-foreground/70">Manage admin users</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-accent transition-all duration-200 text-foreground transform hover:scale-105"
          >
            Create New Admin
          </button>
        </div>
      </div>

      {/* Info Message */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 animate-fadeInSlideUp delay-100">
        <div className="flex items-start">
          <svg className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-base font-semibold text-blue-500 mb-1">Admin Management</h3>
            <p className="text-foreground/80 text-sm">
              Admin management functionality is being developed. Currently, you can create new admins using the form above.
              Existing admins will be displayed here once the feature is fully implemented.
            </p>
          </div>
        </div>
      </div>

      {/* Admins Table */}
      <div className="bg-card rounded-xl shadow-sm border border-border animate-fadeInSlideUp delay-150">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h2 className="text-lg font-semibold text-foreground">Admins List</h2>
            <p className="text-sm text-foreground/70">
              Total admins: {admins.length}
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-accent">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {admins.length > 0 ? (
                  admins.map((admin) => (
                    <tr key={admin._id} className="hover:bg-accent/50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-foreground">{admin.username}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-foreground/70">{admin.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          admin.role === 'superadmin' 
                            ? 'bg-purple-500/10 text-purple-500' 
                            : 'bg-primary/10 text-primary'
                        }`}>
                          {admin.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          admin.isActive 
                            ? 'bg-green-500/10 text-green-500' 
                            : 'bg-destructive/10 text-destructive'
                        }`}>
                          {admin.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex flex-wrap gap-2">
                          <select
                            value={admin.role}
                            onChange={(e) => updateAdminRole(admin._id, e.target.value)}
                            className="bg-background border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                          >
                            <option value="admin">Admin</option>
                            <option value="superadmin">Super Admin</option>
                          </select>
                          
                          {admin.isActive ? (
                            <button
                              onClick={() => deactivateAdmin(admin._id)}
                              className="px-3 py-1 bg-destructive/10 text-destructive rounded hover:bg-destructive/20 transition-all duration-200 transform hover:scale-105"
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              disabled
                              className="px-3 py-1 bg-border text-foreground/50 rounded cursor-not-allowed"
                            >
                              Inactive
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="h-12 w-12 text-foreground/20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <h3 className="text-lg font-medium text-foreground/50 mb-1">No admins found</h3>
                        <p className="text-foreground/50 max-w-md">
                          Admin management functionality is being developed. Create your first admin using the "Create New Admin" button above.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}