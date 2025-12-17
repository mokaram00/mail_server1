'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ClassificationsManagement() {
  const [classifications, setClassifications] = useState<string[]>([]);
  const [usersByClassification, setUsersByClassification] = useState<{[key: string]: number}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [newClassification, setNewClassification] = useState('');
  const [showAddClassificationForm, setShowAddClassificationForm] = useState(false);
  const router = useRouter();

  // Check if user is authenticated and is admin
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.push('/login');
      return;
    }
    
    setToken(storedToken);
    
    // Fetch classifications and user counts
    fetchClassifications(storedToken);
    fetchUsersByClassification(storedToken);
  }, [router]);

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
      setError('Failed to load classifications');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersByClassification = async (authToken: string) => {
    try {
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
      const users = data.users;
      
      // Count users by classification
      const counts: {[key: string]: number} = {};
      users.forEach((user: any) => {
        if (user.accountClassification) {
          counts[user.accountClassification] = (counts[user.accountClassification] || 0) + 1;
        }
      });
      
      setUsersByClassification(counts);
    } catch (err) {
      console.error('Failed to load user counts', err);
    }
  };

  const handleAddClassification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newClassification) return;
    
    try {
      setError(null);
      setSuccess(null);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/classifications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ classification: newClassification }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to add classification');
      }
      
      setSuccess(data.message);
      setNewClassification('');
      setShowAddClassificationForm(false);
      
      // Refresh classifications
      fetchClassifications(token);
      fetchUsersByClassification(token);
    } catch (err: any) {
      setError(err.message || 'Failed to add classification');
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

      <h1 className="text-3xl font-bold mb-8">Account Classifications</h1>

      {/* Add Classification Form */}
      <div className="mb-6">
        <button 
          onClick={() => setShowAddClassificationForm(!showAddClassificationForm)}
          className="px-4 py-2 bg-foreground text-background rounded-lg hover:bg-muted transition-colors"
        >
          {showAddClassificationForm ? 'Cancel' : 'Add New Classification'}
        </button>
      </div>

      {showAddClassificationForm && (
        <div className="mb-8 bg-card border border-foreground/20 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Add New Classification</h2>
          
          <form onSubmit={handleAddClassification} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Classification Name</label>
              <input
                type="text"
                value={newClassification}
                onChange={(e) => setNewClassification(e.target.value)}
                className="w-full px-3 py-2 border border-foreground/20 rounded bg-background"
                placeholder="rockstar"
                required
              />
            </div>
            
            <div className="flex space-x-3">
              <button 
                type="submit"
                className="px-4 py-2 bg-foreground text-background rounded-lg hover:bg-muted transition-colors"
              >
                Add Classification
              </button>
              <button 
                type="button"
                onClick={() => setShowAddClassificationForm(false)}
                className="px-4 py-2 border border-foreground/20 rounded-lg hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-card border border-foreground/20 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-foreground/20">
          <h2 className="text-xl font-semibold">Classifications Overview</h2>
          <p className="text-sm text-foreground/80 mt-1">
            Total classifications: {classifications.length}
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-foreground/20">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Classification</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Number of Users</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/20">
              {classifications.map((classification) => (
                <tr key={classification} className="hover:bg-muted/30">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium">{classification}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-foreground/80">
                      {usersByClassification[classification] || 0} users
                    </div>
                  </td>
                </tr>
              ))}
              
              {classifications.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-6 py-4 text-center text-foreground/60">
                    No classifications found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 bg-card border border-foreground/20 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">About Account Classifications</h2>
        <p className="text-foreground/80 mb-4">
          Account classifications allow you to group users based on categories like "rockstar", "vip", "premium", etc.
          These classifications can be used for reporting, targeted communications, and special permissions.
        </p>
        <p className="text-foreground/80">
          To assign a classification to a user, go to the Users section and either create a new user or edit an existing one.
          Classifications will appear in the user list and can be filtered.
        </p>
      </div>
    </div>
  );
}