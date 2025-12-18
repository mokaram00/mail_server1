'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../utils/apiClient';
import Modal from '../../components/Modal';

export default function ClassificationsManagement() {
  const [classifications, setClassifications] = useState<string[]>([]);
  const [usersByClassification, setUsersByClassification] = useState<{[key: string]: number}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newClassification, setNewClassification] = useState('');
  const [showAddClassificationForm, setShowAddClassificationForm] = useState(false);
  const router = useRouter();

  // Listen for classificationCreated event to update the list
  useEffect(() => {
    const handleClassificationCreated = () => {
      fetchClassifications();
      fetchUsersByClassification();
    };

    window.addEventListener('classificationCreated', handleClassificationCreated);

    return () => {
      window.removeEventListener('classificationCreated', handleClassificationCreated);
    };
  }, []);

  // Fetch classifications and user counts
  useEffect(() => {
    fetchClassifications();
    fetchUsersByClassification();
  }, []);

  const fetchClassifications = async () => {
    try {
      const response = await apiClient.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/classifications`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch classifications');
      }
      
      const data = await response.json();
      setClassifications(data.classifications.map((c: any) => c.classification));
    } catch (err) {
      (window as any).addToast('Failed to load classifications', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersByClassification = async () => {
    try {
      const response = await apiClient.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`);
      
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
    if (!newClassification) return;
    
    try {
      setError(null);
      setSuccess(null);
      
      const response = await apiClient.post(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/classifications`, { classification: newClassification });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to add classification');
      }
      
      // Use toast notification instead of inline message
      (window as any).addToast(data.message, 'success');
      setNewClassification('');
      setShowAddClassificationForm(false);
      
      // Refresh classifications
      fetchClassifications();
      fetchUsersByClassification();
    } catch (err: any) {
      (window as any).addToast(err.message || 'Failed to add classification', 'error');
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
    <div className="min-h-screen bg-background text-foreground animate-fadeIn">
      {/* Add Classification Modal */}
      <Modal
        isOpen={showAddClassificationForm}
        onClose={() => setShowAddClassificationForm(false)}
        title="Add New Classification"
      >
        <form onSubmit={handleAddClassification} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground/80">Classification Name</label>
            <input
              type="text"
              value={newClassification}
              onChange={(e) => setNewClassification(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded bg-background text-foreground transition-all duration-200"
              placeholder="rockstar"
              required
            />
          </div>
          
          <div className="flex space-x-3">
            <button 
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 transform hover:scale-105"
            >
              Add Classification
            </button>
            <button 
              type="button"
              onClick={() => setShowAddClassificationForm(false)}
              className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-all duration-200 text-foreground"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <h1 className="text-3xl font-bold mb-8 animate-fadeInSlideDown">Account Classifications</h1>

      {/* Add Classification Button */}
      <div className="mb-6 animate-fadeInSlideDown">
        <button 
          onClick={() => {
            const event = new CustomEvent('openCreateClassificationModal');
            window.dispatchEvent(event);
          }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 transform hover:scale-105"
        >
          Add New Classification
        </button>
      </div>

      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden animate-fadeInSlideUp delay-100">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Classifications Overview</h2>
          <p className="text-sm text-foreground/70 mt-1">
            Total classifications: {classifications.length}
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-accent">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider">Classification</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider">Number of Users</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {classifications.map((classification) => (
                <tr key={classification} className="hover:bg-accent/50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-foreground">{classification}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-foreground/70">
                      {usersByClassification[classification] || 0} users
                    </div>
                  </td>
                </tr>
              ))}
              
              {classifications.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-6 py-4 text-center text-foreground/50">
                    No classifications found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 bg-card border border-border rounded-lg shadow-sm p-6 animate-fadeInSlideUp delay-150">
        <h2 className="text-xl font-semibold mb-4 text-foreground">About Account Classifications</h2>
        <p className="text-foreground/70 mb-4">
          Account classifications allow you to group users based on categories like "rockstar", "vip", "premium", etc.
          These classifications can be used for reporting, targeted communications, and special permissions.
        </p>
        <p className="text-foreground/70">
          To assign a classification to a user, go to the Users section and either create a new user or edit an existing one.
          Classifications must be created in this section before they can be assigned to users.
        </p>
      </div>
    </div>
  );
}