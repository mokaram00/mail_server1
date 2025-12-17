'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Domain {
  domain: string;
  isDefault: boolean;
}

export default function DomainsManagement() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [newDomain, setNewDomain] = useState('');
  const [showDomainForm, setShowDomainForm] = useState(false);
  const router = useRouter();

  // Check if user is authenticated and is admin
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.push('/login');
      return;
    }
    
    setToken(storedToken);
    
    // Fetch domains
    fetchDomains(storedToken);
  }, [router]);

  const handleSetDefaultDomain = async (domain: string) => {
    if (!token) return;
    
    try {
      setError(null);
      setSuccess(null);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/domains/default`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to set default domain');
      }
      
      setSuccess(data.message);
      
      // Refresh domains
      fetchDomains(token);
    } catch (err: any) {
      setError(err.message || 'Failed to set default domain');
      console.error(err);
    }
  };

  const fetchDomains = async (authToken: string) => {
    try {
      setLoading(true);
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
      setError('Failed to load domains');
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

      <h1 className="text-3xl font-bold mb-8">Domain Management</h1>

      {/* Domain Management Form */}
      <div className="mb-8 bg-card border border-foreground/20 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Manage Domains</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Set Default Domain</h3>
            <div className="flex gap-2">
              <select
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                className="flex-1 px-3 py-2 border border-foreground/20 rounded bg-background"
              >
                <option value="">Select a domain</option>
                {domains.map((domain) => (
                  <option key={domain.domain} value={domain.domain}>
                    {domain.domain}
                  </option>
                ))}
              </select>
              <button 
                onClick={() => handleSetDefaultDomain(newDomain)}
                disabled={!newDomain}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  newDomain 
                    ? 'bg-foreground text-background hover:bg-muted' 
                    : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                }`}
              >
                Set Default
              </button>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-3">Available Domains</h3>
            <div className="max-h-40 overflow-y-auto border border-foreground/20 rounded p-3">
              {domains.length > 0 ? (
                <ul className="space-y-2">
                  {domains.map((domain) => (
                    <li key={domain.domain} className="flex justify-between items-center">
                      <span>{domain.domain}</span>
                      {domain.isDefault && (
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-500 text-xs rounded">
                          Default
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-foreground/60">No domains found</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Domains List */}
      <div className="bg-card border border-foreground/20 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-foreground/20">
          <h2 className="text-xl font-semibold">Domains List</h2>
          <p className="text-sm text-foreground/80 mt-1">
            Total domains: {domains.length}
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-foreground/20">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Domain</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/20">
              {domains.map((domain) => (
                <tr key={domain.domain} className="hover:bg-muted/30">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium">{domain.domain}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {domain.isDefault ? (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-500 text-xs rounded">
                        Default
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-500/20 text-gray-500 text-xs rounded">
                        Normal
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {!domain.isDefault && (
                      <button
                        onClick={() => handleSetDefaultDomain(domain.domain)}
                        className="px-3 py-1 bg-foreground text-background rounded hover:bg-muted transition-colors"
                      >
                        Set as Default
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {domains.length === 0 && (
            <div className="text-center py-12 text-foreground/60">
              No domains found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}