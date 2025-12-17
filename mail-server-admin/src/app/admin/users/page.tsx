'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
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
  const [token, setToken] = useState<string | null>(null);
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

  // Check if user is authenticated and is admin
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.push('/login');
      return;
    }
    
    setToken(storedToken);
    
    // Fetch users, domains and classifications
    fetchUsers(storedToken);
    fetchDomains(storedToken);
    fetchClassifications(storedToken);
  }, [router]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    try {
      setError(null);
      setSuccess(null);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create user');
      }
      
      setSuccess('User created successfully');
      setNewUser({ username: '', password: '', role: 'user', domain: '', isDefaultDomain: false, accountClassification: '' });
      setShowCreateForm(false);
      
      // Refresh users list
      fetchUsers(token);
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
      console.error(err);
    }
  };

  const handleBulkCreateUsers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
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
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/bulk`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ users: usersArray }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create users');
      }
      
      setSuccess(`Successfully created ${data.users.length} users`);
      setBulkUsers('');
      setShowBulkCreateForm(false);
      
      // Refresh users list
      fetchUsers(token);
    } catch (err: any) {
      setError(err.message || 'Failed to create users');
      console.error(err);
    }
  };

  const fetchUsers = async (authToken: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data.users);
    } catch (err) {
      setError('Failed to load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDomains = async (authToken: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/domains`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch domains');
      }
      
      const data = await response.json();
      setDomains(data.domains);
    } catch (err) {
      console.error('Failed to load domains', err);
    }
  };

  const fetchClassifications = async (authToken: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/classifications`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch classifications');
      }
      
      const data = await response.json();
      setClassifications(data.classifications);
    } catch (err) {
      console.error('Failed to load classifications', err);
    }
  };

  const updateUserRole = async (userId: number, newRole: string) => {
    if (!token) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user role');
      }
      
      const data = await response.json();
      // Update user in state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: data.user.role } : user
      ));
    } catch (err) {
      setError('Failed to update user role');
      console.error(err);
    }
  };

  const updateUserClassification = async (userId: number, newClassification: string) => {
    if (!token) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}/classification`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ classification: newClassification || null }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user classification');
      }
      
      const data = await response.json();
      // Update user in state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, accountClassification: data.user.accountClassification } : user
      ));
      
      // Refresh user counts by classification
      fetchClassifications(token);
    } catch (err) {
      setError('Failed to update user classification');
      console.error(err);
    }
  };

  const deactivateUser = async (userId: number) => {
    if (!token) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}/deactivate`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to deactivate user');
      }
      
      const data = await response.json();
      // Update user in state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, isActive: data.user.isActive } : user
      ));
    } catch (err) {
      setError('Failed to deactivate user');
      console.error(err);
    }
  };

  const showUserPassword = async (userId: number) => {
    if (!token) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}/password`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to get user password');
      }
      
      const data: PasswordResponse = await response.json();
      
      // Show the password to the admin
      alert(`Password for user: ${data.password}`);
      
      setSuccess('Password retrieved successfully');
    } catch (err) {
      setError('Failed to get user password');
      console.error(err);
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
    <div className="min-h-screen bg-background text-foreground">
      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-500">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-6 p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-500">
          {success}
        </div>
      )}

      <h1 className="text-3xl font-bold mb-8">User Management</h1>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center">
          <label className="mr-2">Filter by Domain:</label>
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="px-3 py-2 border border-foreground/20 rounded bg-background"
          >
            <option value="all">All Domains</option>
            {domains.map((domain) => (
              <option key={domain.domain} value={domain.domain}>
                {domain.domain} {domain.isDefault ? '(Default)' : ''}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center">
          <label className="mr-2">Filter by Classification:</label>
          <select
            value={selectedClassification}
            onChange={(e) => setSelectedClassification(e.target.value)}
            className="px-3 py-2 border border-foreground/20 rounded bg-background"
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

      {/* Action Buttons */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-foreground text-background rounded-lg hover:bg-muted transition-colors"
        >
          {showCreateForm ? 'Cancel' : 'Create New User'}
        </button>
        
        <button 
          onClick={() => setShowBulkCreateForm(!showBulkCreateForm)}
          className="px-4 py-2 bg-foreground text-background rounded-lg hover:bg-muted transition-colors"
        >
          {showBulkCreateForm ? 'Cancel' : 'Bulk Create Users'}
        </button>
      </div>

      {/* Create User Form */}
      {showCreateForm && (
        <div className="mb-8 bg-card border border-foreground/20 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Create New User</h2>
          
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <input
                type="text"
                value={newUser.username}
                onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                className="w-full px-3 py-2 border border-foreground/20 rounded bg-background"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                className="w-full px-3 py-2 border border-foreground/20 rounded bg-background"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                className="w-full px-3 py-2 border border-foreground/20 rounded bg-background"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Domain (optional)</label>
              <select
                value={newUser.domain}
                onChange={(e) => setNewUser({...newUser, domain: e.target.value})}
                className="w-full px-3 py-2 border border-foreground/20 rounded bg-background"
              >
                <option value="">Select a domain</option>
                {domains.map((domain) => (
                  <option key={domain.domain} value={domain.domain}>
                    {domain.domain} {domain.isDefault ? '(Default)' : ''}
                  </option>
                ))}
                <option value="">Other (specify below)</option>
              </select>
              {newUser.domain && !domains.some(d => d.domain === newUser.domain) && (
                <div className="mt-2 text-sm text-foreground/80">
                  Will create new domain: <strong>{newUser.domain}</strong>
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Account Classification (optional)</label>
              <div className="flex space-x-2">
                <select
                  value={newUser.accountClassification || ''}
                  onChange={(e) => setNewUser({...newUser, accountClassification: e.target.value})}
                  className="flex-1 px-3 py-2 border border-foreground/20 rounded bg-background"
                >
                  <option value="">Select existing or create new</option>
                  {classifications.map((classification) => (
                    <option key={classification} value={classification}>
                      {classification}
                    </option>
                  ))}
                </select>
                <button 
                  type="button"
                  onClick={() => {
                    const newClassification = prompt('Enter new classification name:');
                    if (newClassification) {
                      setNewUser({...newUser, accountClassification: newClassification});
                    }
                  }}
                  className="px-3 py-2 bg-foreground text-background rounded-lg hover:bg-muted transition-colors"
                >
                  + New
                </button>
              </div>
              {newUser.accountClassification && !classifications.includes(newUser.accountClassification) && (
                <div className="mt-2 text-sm text-foreground/80">
                  Will create new classification: <strong>{newUser.accountClassification}</strong>
                </div>
              )}
            </div>
            <div className="flex space-x-3">
              <button 
                type="submit"
                className="px-4 py-2 bg-foreground text-background rounded-lg hover:bg-muted transition-colors"
              >
                Create User
              </button>
              <button 
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-foreground/20 rounded-lg hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bulk Create Users Form */}
      {showBulkCreateForm && (
        <div className="mb-8 bg-card border border-foreground/20 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Bulk Create Users</h2>
          <p className="text-sm text-foreground/80 mb-4">
            Enter one user per line in the format: username,email,password,role,domain,classification
            <br />
            Role, domain, and classification are optional (defaults to 'user', empty, and empty respectively)
            <br />
            Available domains: {domains.map(d => d.domain).join(', ')}
          </p>
          
          <form onSubmit={handleBulkCreateUsers} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Users Data</label>
              <textarea
                value={bulkUsers}
                onChange={(e) => setBulkUsers(e.target.value)}
                rows={10}
                className="w-full px-3 py-2 border border-foreground/20 rounded bg-background font-mono text-sm"
                placeholder="john,john@example.com,password123,user,example.com,rockstar&#10;jane,jane@test.com,password456,admin,test.com,vip"
                required
              />
            </div>
            
            <div className="flex space-x-3">
              <button 
                type="submit"
                className="px-4 py-2 bg-foreground text-background rounded-lg hover:bg-muted transition-colors"
              >
                Create Users
              </button>
              <button 
                type="button"
                onClick={() => setShowBulkCreateForm(false)}
                className="px-4 py-2 border border-foreground/20 rounded-lg hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-card border border-foreground/20 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-foreground/20">
          <h2 className="text-xl font-semibold">Users List</h2>
          <p className="text-sm text-foreground/80 mt-1">
            Showing {filteredUsers.length} of {users.length} users
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-foreground/20">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Domain</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Classification</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/20">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-muted/30">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium">{user.username}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-foreground/80">{user.username}@{user.domain}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-foreground/80">
                      {user.domain || '-'}
                      {user.isDefaultDomain && (
                        <span className="ml-2 px-2 py-1 bg-blue-500/20 text-blue-500 text-xs rounded">
                          Default
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <select
                        value={user.accountClassification || ''}
                        onChange={(e) => updateUserClassification(user.id, e.target.value)}
                        className="bg-background border border-foreground/20 rounded px-2 py-1 text-sm"
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'admin' 
                        ? 'bg-blue-500/20 text-blue-500' 
                        : 'bg-green-500/20 text-green-500'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.isActive 
                        ? 'bg-green-500/20 text-green-500' 
                        : 'bg-red-500/20 text-red-500'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex flex-wrap gap-2">
                      <select
                        value={user.role}
                        onChange={(e) => updateUserRole(user.id, e.target.value)}
                        className="bg-background border border-foreground/20 rounded px-2 py-1 text-sm"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                      
                      {user.isActive ? (
                        <button
                          onClick={() => deactivateUser(user.id)}
                          className="px-3 py-1 bg-red-500/20 text-red-500 rounded hover:bg-red-500/30 transition-colors"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          disabled
                          className="px-3 py-1 bg-gray-500/20 text-gray-500 rounded cursor-not-allowed"
                        >
                          Inactive
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          // Open email login for this user
                          window.open(`/login?email=${encodeURIComponent(user.email)}`, '_blank');
                        }}
                        className="px-3 py-1 bg-purple-500/20 text-purple-500 rounded hover:bg-purple-500/30 transition-colors"
                      >
                        Login
                      </button>
                      
                      <button
                        onClick={() => {
                          // Open inbox for this user
                          window.open(`/inbox?user=${user.id}`, '_blank');
                        }}
                        className="px-3 py-1 bg-indigo-500/20 text-indigo-500 rounded hover:bg-indigo-500/30 transition-colors"
                      >
                        Inbox
                      </button>
                      
                      <button
                        onClick={() => showUserPassword(user.id)}
                        className="px-3 py-1 bg-yellow-500/20 text-yellow-500 rounded hover:bg-yellow-500/30 transition-colors"
                      >
                        Show Pass
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-foreground/60">
              No users found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}