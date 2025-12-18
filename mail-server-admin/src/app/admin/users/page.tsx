'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../utils/apiClient';
import Modal from '../../components/Modal';

interface User {
  _id: number | string ;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  domain?: string;
  isDefaultDomain?: boolean;
  accountClassification?: string;
  createdAt: string;
  updatedAt: string;
}

interface PasswordResponse {
  password: string;
}

interface Domain {
  domain: string;
  isDefault: boolean;
}

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [classifications, setClassifications] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showBulkCreateForm, setShowBulkCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: 'user',
    domain: '',
    isDefaultDomain: false,
    accountClassification: ''
  });
  const [bulkUsers, setBulkUsers] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [selectedClassification, setSelectedClassification] = useState<string>('all');
  const router = useRouter();

  // Listen for userCreated event to update the list
  useEffect(() => {
    const handleUserCreated = () => {
      fetchUsers();
    };

    window.addEventListener('userCreated', handleUserCreated);

    return () => {
      window.removeEventListener('userCreated', handleUserCreated);
    };
  }, []);

  // Fetch users, domains and classifications
  useEffect(() => {
    fetchUsers();
    fetchDomains();
    fetchClassifications();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError(null);
      setSuccess(null);
      
      const response = await apiClient.post(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`, newUser);
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create user');
      }
      
      // Use toast notification instead of inline message
      (window as any).addToast('User created successfully', 'success');
      setNewUser({ username: '', password: '', role: 'user', domain: '', isDefaultDomain: false, accountClassification: '' });
      setShowCreateForm(false);
      
      // Refresh users list
      fetchUsers();
    } catch (err: any) {
      (window as any).addToast(err.message || 'Failed to create user', 'error');
      console.error(err);
    }
  };

  const handleBulkCreateUsers = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError(null);
      setSuccess(null);
      
      // Parse bulk users from textarea
      const usersArray = bulkUsers.split('\n')
        .filter(line => line.trim() !== '')
        .map(line => {
          const [username, password, role = 'user', domain = '', accountClassification = ''] = line.split(',');
          return { username, password, role, domain, accountClassification };
        });
      
      const response = await apiClient.post(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/bulk`, { users: usersArray });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create users');
      }
      
      (window as any).addToast(`Successfully created ${data.users.length} users`, 'success');
      setBulkUsers('');
      setShowBulkCreateForm(false);
      
      // Refresh users list
      fetchUsers();
    } catch (err: any) {
      (window as any).addToast(err.message || 'Failed to create users', 'error');
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      console.log('Users data received:', data.users);
      
      // Check what ID fields are available
      data.users.forEach((user: any) => {
        console.log('User object keys:', Object.keys(user));
        console.log('User _id:', user._id, typeof user._id);
      });
      
      // Map users to ensure they have the correct id field
      const mappedUsers = data.users.map((user: any) => ({
        ...user,
            }));
      
      setUsers(mappedUsers);
    } catch (err) {
      (window as any).addToast('Failed to load users', 'error');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDomains = async () => {
    try {
      const response = await apiClient.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/domains`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch domains');
      }
      
      const data = await response.json();
      setDomains(data.domains);
    } catch (err) {
      console.error('Failed to load domains', err);
    }
  };

  const fetchClassifications = async () => {
    try {
      const response = await apiClient.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/classifications`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch classifications');
      }
      
      const data = await response.json();
      setClassifications(data.classifications.map((c: any) => c.classification));
    } catch (err) {
      console.error('Failed to load classifications', err);
    }
  };

  const updateUserRole = async (userId: number | string, newRole: string) => {
    // Debug: Check if userId is valid
    console.log('Updating user role for ID:', userId);
    if (!userId) {
      (window as any).addToast('Invalid user ID', 'error');
      return;
    }
    
    try {
      const response = await apiClient.put(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}/role`, { role: newRole });
      
      if (!response.ok) {
        throw new Error('Failed to update user role');
      }
      
      const data = await response.json();
      // Update user in state
      setUsers(users.map(user => 
        user._id === userId ? { ...user, role: data.user.role } : user
      ));
      
      (window as any).addToast('User role updated successfully', 'success');
    } catch (err) {
      (window as any).addToast('Failed to update user role', 'error');
      console.error('Error updating user role:', err);
    }
  };

  const updateUserClassification = async (userId: number | string, newClassification: string) => {
    // Debug: Check if userId is valid
    console.log('Updating user classification for ID:', userId);
    if (!userId) {
      (window as any).addToast('Invalid user ID', 'error');
      return;
    }
    
    try {
      const response = await apiClient.put(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}/classification`, { classification: newClassification || null });
      
      if (!response.ok) {
        throw new Error('Failed to update user classification');
      }
      
      const data = await response.json();
      // Update user in state
      setUsers(users.map(user => 
        user._id === userId ? { ...user, accountClassification: data.user.accountClassification } : user
      ));
      
      // Refresh user counts by classification
      fetchClassifications();
      
      (window as any).addToast('User classification updated successfully', 'success');
    } catch (err) {
      (window as any).addToast('Failed to update user classification', 'error');
      console.error('Error updating user classification:', err);
    }
  };

  const deactivateUser = async (userId: number | string) => {
    // Debug: Check if userId is valid
    console.log('Deactivating user ID:', userId);
    if (!userId) {
      (window as any).addToast('Invalid user ID', 'error');
      return;
    }
    
    try {
      const response = await apiClient.put(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}/deactivate`, {});
      
      if (!response.ok) {
        throw new Error('Failed to deactivate user');
      }
      
      const data = await response.json();
      // Update user in state
      setUsers(users.map(user => 
        user._id === userId ? { ...user, isActive: data.user.isActive } : user
      ));
      
      (window as any).addToast('User deactivated successfully', 'success');
    } catch (err) {
      (window as any).addToast('Failed to deactivate user', 'error');
      console.error('Error deactivating user:', err);
    }
  };

  const showUserPassword = async (userId: number | string) => {
    // Debug: Check if userId is valid
    console.log('Showing password for user ID:', userId);
    if (!userId) {
      (window as any).addToast('Invalid user ID', 'error');
      return;
    }
    
    try {
      const response = await apiClient.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}/password`);
      
      if (!response.ok) {
        throw new Error('Failed to get user password');
      }
      
      const data: PasswordResponse = await response.json();
      
      // Show the password to the admin
      alert(`Password for user: ${data.password}`);
      
      (window as any).addToast('Password retrieved successfully', 'success');
    } catch (err) {
      (window as any).addToast('Failed to get user password', 'error');
      console.error('Error getting user password:', err);
    }
  };

  // Filter users based on selected domain and classification
  const filteredUsers = users.filter(user => {
    const domainMatch = selectedDomain === 'all' || user.domain === selectedDomain;
    const classificationMatch = selectedClassification === 'all' || user.accountClassification === selectedClassification;
    return domainMatch && classificationMatch;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-foreground"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Create User Modal */}
      <Modal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        title="Create New User"
        size="lg"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">Username</label>
              <input
                type="text"
                value={newUser.username}
                onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground transition-all duration-200"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">Password</label>
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground transition-all duration-200"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">Role</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground transition-all duration-200"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">Domain (optional)</label>
              <select
                value={newUser.domain}
                onChange={(e) => setNewUser({...newUser, domain: e.target.value})}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground transition-all duration-200"
              >
                <option value="">Select a domain</option>
                {domains.map((domain) => (
                  <option key={domain.domain} value={domain.domain}>
                    {domain.domain} {domain.isDefault ? '(Default)' : ''}
                  </option>
                ))}
              </select>
              {newUser.domain && !domains.some(d => d.domain === newUser.domain) && (
                <div className="mt-2 text-sm text-destructive">
                  Domain does not exist: <strong>{newUser.domain}</strong>
                </div>
              )}
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground/80 mb-1">Account Classification (optional)</label>
              <div className="flex space-x-2">
                <select
                  value={newUser.accountClassification || ''}
                  onChange={(e) => setNewUser({...newUser, accountClassification: e.target.value})}
                  className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground transition-all duration-200"
                >
                  <option value="">Select existing or create new</option>
                  {classifications.map((classification) => (
                    <option key={classification} value={classification}>
                      {classification}
                    </option>
                  ))}
                </select>
              </div>
              {newUser.accountClassification && !classifications.includes(newUser.accountClassification) && (
                <div className="mt-2 text-sm text-destructive">
                  Classification does not exist: <strong>{newUser.accountClassification}</strong>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button 
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 transform hover:scale-105"
            >
              Create User
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
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-foreground/70">Manage all users in the system</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button 
            onClick={() => {
              const event = new CustomEvent('openCreateUserModal');
              window.dispatchEvent(event);
            }}
            className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-accent transition-all duration-200 text-foreground transform hover:scale-105"
          >
            Create New User
          </button>
          <button 
            onClick={() => {
              const event = new CustomEvent('openCreateBulkUsersModal');
              window.dispatchEvent(event);
            }}
            className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-accent transition-all duration-200 text-foreground transform hover:scale-105"
          >
            Bulk Create Users
          </button>
          <button 
            onClick={() => {
              const event = new CustomEvent('openGenerateEmailsModal');
              window.dispatchEvent(event);
            }}
            className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-accent transition-all duration-200 text-foreground transform hover:scale-105"
          >
            Generate Email Accounts
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-6 animate-fadeInSlideUp delay-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1">Filter by Domain</label>
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground transition-all duration-200"
            >
              <option value="all">All Domains</option>
              {domains.map((domain) => (
                <option key={domain.domain} value={domain.domain}>
                  {domain.domain} {domain.isDefault ? '(Default)' : ''}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1">Filter by Classification</label>
            <select
              value={selectedClassification}
              onChange={(e) => setSelectedClassification(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground transition-all duration-200"
            >
              <option value="all">All Classifications</option>
              {classifications.map((classification) => (
                <option key={classification} value={classification}>
                  {classification}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-card rounded-xl shadow-sm border border-border animate-fadeInSlideUp delay-150">
        <div className="p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold text-foreground">Users List</h2>
            <p className="text-sm text-foreground/70">
              Showing {filteredUsers.length} of {users.length} users
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-accent">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider">Username</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider">Domain</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider">Classification</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider">Role</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-accent/50 transition-colors duration-150">
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="font-medium text-foreground text-sm"> {user.username}</div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="text-foreground/70 text-sm">{user.username}@{user.domain}</div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="text-foreground/70 text-sm">
                        {user.domain || '-'}
                        {user.isDefaultDomain && (
                          <span className="ml-1 px-1.5 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <select
                          value={user.accountClassification || ''}
                          onChange={(e) => {
                            console.log('Classification change for user:', user._id, 'to:', e.target.value);
                            updateUserClassification(user._id, e.target.value);
                          }}
                          className="bg-background border border-border rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                        >
                          <option value="">No Classification</option>
                          {classifications.map((classification) => (
                            <option key={classification} value={classification}>
                              {classification}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-primary/10 text-primary' 
                          : 'bg-green-500/10 text-green-500'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isActive 
                          ? 'bg-green-500/10 text-green-500' 
                          : 'bg-destructive/10 text-destructive'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        <select
                          value={user.role}
                          onChange={(e) => {
                            console.log('Role change for user:', user._id, 'to:', e.target.value);
                            updateUserRole(user._id, e.target.value);
                          }}
                          className="bg-background border border-border rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                        
                        {user.isActive ? (
                          <button
                            onClick={() => {
                              console.log('Deactivating user:', user._id);
                              deactivateUser(user._id);
                            }}
                            className="p-1 text-destructive hover:bg-destructive/20 rounded transition-colors duration-200"
                            title="Deactivate user"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                            </svg>
                          </button>
                        ) : (
                          <button
                            disabled
                            className="p-1 text-foreground/50 cursor-not-allowed"
                            title="Inactive user"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                            </svg>
                          </button>
                        )}
                        
                        <button
                          onClick={() => {
                            // Open email login for this user
                            window.open(`/login?email=${encodeURIComponent(user.email)}`, '_blank');
                          }}
                          className="p-1 text-purple-500 hover:bg-purple-500/20 rounded transition-colors duration-200"
                          title="Login as user"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                          </svg>
                        </button>
                        
                        <button
                          onClick={() => {
                            // Open inbox for this user
                            window.open(`/inbox?user=${user._id}`, '_blank');
                          }}
                          className="p-1 text-indigo-500 hover:bg-indigo-500/20 rounded transition-colors duration-200"
                          title="View inbox"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                        </button>
                        
                        <button
                          onClick={() => {
                            console.log('Showing password for user:', user._id);
                            showUserPassword(user._id);
                          }}
                          className="p-1 text-yellow-500 hover:bg-yellow-500/20 rounded transition-colors duration-200"
                          title="Show password"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-foreground/50">
                No users found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
