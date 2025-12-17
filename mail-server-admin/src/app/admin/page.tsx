'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  totalUsers: number;
  totalEmails: number;
  activeUsers: number;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user'
  });
  const router = useRouter();

  // Check if user is authenticated and is admin
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.push('/login');
      return;
    }
    
    setToken(storedToken);
    
    // Fetch users and stats
    fetchUsers(storedToken);
    fetchStats(storedToken);
  }, [router]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    try {
      setError(null);
      setSuccess(null);
      
      const response = await fetch('http://localhost:3000/api/admin/users', {
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
      setNewUser({ username: '', email: '', password: '', role: 'user' });
      setShowCreateForm(false);
      
      // Refresh users list
      fetchUsers(token);
      fetchStats(token);
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
      console.error(err);
    }
  };

  const fetchUsers = async (authToken: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.API}/api/admin/users`, {
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

  const fetchStats = async (authToken: string) => {
    try {
      const response = await fetch(`${process.env.API}/api/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      
      const data = await response.json();
      setStats(data.stats);
    } catch (err) {
      setError('Failed to load stats');
      console.error(err);
    }
  };

  const updateUserRole = async (userId: number, newRole: string) => {
    if (!token) return;
    
    try {
      const response = await fetch(`${process.env.API}/api/admin/users/${userId}/role`, {
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

  const deactivateUser = async (userId: number) => {
    if (!token) return;
    
    try {
      const response = await fetch(`${process.env.API}/api/admin/users/${userId}/deactivate`, {
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-foreground"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-foreground/20 bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => {
                localStorage.removeItem('token');
                router.push('/login');
              }}
              className="px-4 py-2 bg-foreground text-background rounded-lg hover:bg-muted transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card border border-foreground/20 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Total Users</h3>
            <p className="text-3xl font-bold">{stats?.totalUsers || 0}</p>
          </div>
          
          <div className="bg-card border border-foreground/20 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Active Users</h3>
            <p className="text-3xl font-bold">{stats?.activeUsers || 0}</p>
          </div>
          
          <div className="bg-card border border-foreground/20 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Total Emails</h3>
            <p className="text-3xl font-bold">{stats?.totalEmails || 0}</p>
          </div>
        </div>

        {/* Create User Button */}
        <div className="mb-6">
          <button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-foreground text-background rounded-lg hover:bg-muted transition-colors"
          >
            {showCreateForm ? 'Cancel' : 'Create New User'}
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
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
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

        {/* Users Table */}
        <div className="bg-card border border-foreground/20 rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-foreground/20">
            <h2 className="text-xl font-semibold">User Management</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-foreground/20">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/20">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium">{user.username}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-foreground/80">{user.email}</div>
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
                      <div className="flex space-x-2">
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {users.length === 0 && (
              <div className="text-center py-12 text-foreground/60">
                No users found
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}