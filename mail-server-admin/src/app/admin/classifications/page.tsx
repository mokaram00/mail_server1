'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ClassificationsManagement() {
  const [classifications, setClassifications] = useState<string[]>([]);
  const [usersByClassification, setUsersByClassification] = useState<{[key: string]: number}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
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

      <h1 className="text-3xl font-bold mb-8">Account Classifications</h1>

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