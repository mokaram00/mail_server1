'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../utils/apiClient';
import Modal from '../../components/Modal';

interface Domain {
  domain: string;
  isDefault: boolean;
}

export default function DomainsManagement() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newDomain, setNewDomain] = useState('');
  const [showAddDomainForm, setShowAddDomainForm] = useState(false);
  const router = useRouter();

  // Listen for domainCreated event to update the list
  useEffect(() => {
    const handleDomainCreated = () => {
      fetchDomains();
    };

    window.addEventListener('domainCreated', handleDomainCreated);

    return () => {
      window.removeEventListener('domainCreated', handleDomainCreated);
    };
  }, []);

  // Fetch domains
  useEffect(() => {
    fetchDomains();
  }, []);

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain) return;
    
    try {
      setError(null);
      setSuccess(null);
      
      const response = await apiClient.post(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/domains`, { domain: newDomain });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to add domain');
      }
      
      // Use toast notification instead of inline message
      (window as any).addToast(data.message, 'success');
      setNewDomain('');
      setShowAddDomainForm(false);
      
      // Refresh domains
      fetchDomains();
    } catch (err: any) {
      (window as any).addToast(err.message || 'Failed to add domain', 'error');
      console.error(err);
    }
  };

  const fetchDomains = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/domains`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch domains');
      }
      
      const data = await response.json();
      setDomains(data.domains);
    } catch (err) {
      (window as any).addToast('Failed to load domains', 'error');
      console.error(err);
    } finally {
      setLoading(false);
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
    <div className="space-y-6 animate-fadeIn">
      {/* Add Domain Modal */}
      <Modal
        isOpen={showAddDomainForm}
        onClose={() => setShowAddDomainForm(false)}
        title="Add New Domain"
      >
        <form onSubmit={handleAddDomain} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1">Domain Name</label>
            <input
              type="text"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground transition-all duration-200"
              placeholder="example.com"
              required
            />
          </div>
          
          <div className="flex space-x-3">
            <button 
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 transform hover:scale-105"
            >
              Add Domain
            </button>
            <button 
              type="button"
              onClick={() => setShowAddDomainForm(false)}
              className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-accent transition-all duration-200 text-foreground transform hover:scale-105"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fadeInSlideDown">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Domain Management</h1>
          <p className="text-foreground/70">Manage email domains for users</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              const event = new CustomEvent('openCreateDomainModal');
              window.dispatchEvent(event);
            }}
            className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-accent transition-all duration-200 text-foreground transform hover:scale-105"
          >
            Add New Domain
          </button>
        </div>
      </div>

      {/* Domain Management Form */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-6 animate-fadeInSlideUp delay-100">
        <h2 className="text-xl font-semibold text-foreground mb-4">Manage Domains</h2>
        
        <div className="grid grid-cols-1 gap-6">
          <div>
            <h3 className="text-lg font-medium text-foreground mb-3">Available Domains</h3>
            <div className="max-h-40 overflow-y-auto border border-border rounded-lg p-3 bg-background">
              {domains.length > 0 ? (
                <ul className="space-y-2">
                  {domains.map((domain) => (
                    <li key={domain.domain} className="flex justify-between items-center">
                      <span className="text-foreground">{domain.domain}</span>
                      {domain.isDefault && (
                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                          Default
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-foreground/50">No domains found</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Domains List */}
      <div className="bg-card rounded-xl shadow-sm border border-border animate-fadeInSlideUp delay-150">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h2 className="text-lg font-semibold text-foreground">Domains List</h2>
            <p className="text-sm text-foreground/70">
              Total domains: {domains.length}
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-accent">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider">Domain</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {domains.map((domain) => (
                  <tr key={domain.domain} className="hover:bg-accent/50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-foreground">{domain.domain}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {domain.isDefault ? (
                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                          Default
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-border text-foreground text-xs rounded-full">
                          Normal
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {/* {!domain.isDefault && (
                        <button
                          onClick={() => handleSetDefaultDomain(domain.domain)}
                          className="px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-all duration-200 transform hover:scale-105"
                        >
                          Set as Default
                        </button>
                      )} */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {domains.length === 0 && (
              <div className="text-center py-12 text-foreground/50">
                No domains found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}