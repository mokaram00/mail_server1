'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../utils/apiClient';
import Modal from '../../components/Modal';

// Helper function to safely call addToast
const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
  if (typeof (window as any).addToast === 'function') {
    (window as any).addToast(message, type);
  } else {
    // Fallback to console logging
    if (type === 'error') {
      console.error(message);
    } else {
      console.log(message);
    }
  }
};

interface Email {
  _id: number | string ;
  username: string;
  email: string;
  isActive: boolean;
  isConnected?: boolean; // New field for connection status
  domain?: string;
  isDefaultDomain?: boolean;
  accountClassification?: string;
  createdAt: string;
  updatedAt: string;
}

interface Domain {
  domain: string;
  isDefault: boolean;
}

export default function EmailsManagement() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [classifications, setClassifications] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showMagicLinkModal, setShowMagicLinkModal] = useState(false);
  const [selectedEmailForMagicLink, setSelectedEmailForMagicLink] = useState<Email | null>(null);
  const [magicLink, setMagicLink] = useState<string>('');
  const [newEmail, setNewEmail] = useState({
    username: '',
    password: '',
    role: 'user',
    domain: '',
    isDefaultDomain: false,
    accountClassification: ''
  });
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [selectedClassification, setSelectedClassification] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>(''); // Add search term state
  const router = useRouter();

  // Listen for emailCreated event to update the list
  useEffect(() => {
    const handleEmailCreated = () => {
      fetchEmails();
    };

    window.addEventListener('emailCreated', handleEmailCreated);

    return () => {
      window.removeEventListener('emailCreated', handleEmailCreated);
    };
  }, []);

  // Fetch emails, domains and classifications
  useEffect(() => {
    fetchEmails();
    fetchDomains();
    fetchClassifications();
  }, []);

  const handleCreateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError(null);
      setSuccess(null);
      
      const response = await apiClient.post(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/emails`, newEmail);
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create email');
      }
      
      // Use toast notification instead of inline message
      showToast('Email created successfully', 'success');
      setNewEmail({ username: '', password: '', role: 'user', domain: '', isDefaultDomain: false, accountClassification: '' });
      setShowCreateForm(false);
      
      // Refresh emails list
      fetchEmails();
    } catch (err: any) {
      showToast(err.message || 'Failed to create email', 'error');
      console.error(err);
    }
  };
  
  const fetchEmails = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/emails`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch emails');
      }
      
      const data = await response.json();
      console.log('Emails data received:', data.emails);
      
      // Check what ID fields are available
      data.emails.forEach((email: any) => {
        console.log('Email object keys:', Object.keys(email));
        console.log('Email _id:', email._id, typeof email._id);
      });
      
      // Map emails to ensure they have the correct id field
      const mappedEmails = data.emails.map((email: any) => ({
        ...email,
      }));
      
      setEmails(mappedEmails);
    } catch (err) {
      showToast('Failed to load emails', 'error');
      console.error('Error fetching emails:', err);
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
      
      // Set default domain for new email form
      const defaultDomain = data.domains.find((d: Domain) => d.isDefault);
      if (defaultDomain) {
        setNewEmail(prev => ({...prev, domain: defaultDomain.domain}));
      }
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

  const updateEmailRole = async (emailId: number | string, newRole: string) => {
    showToast('Email roles are no longer supported', 'error');
  };

  const updateEmailClassification = async (emailId: number | string, newClassification: string) => {
    // Debug: Check if emailId is valid
    console.log('Updating email classification for ID:', emailId);
    if (!emailId) {
      showToast('Invalid email ID', 'error');
      return;
    }
    
    try {
      const response = await apiClient.put(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/emails/${emailId}/classification`, { classification: newClassification || null });
      
      if (!response.ok) {
        throw new Error('Failed to update email classification');
      }
      
      const data = await response.json();
      // Update email in state
      setEmails(emails.map(email => 
        email._id === emailId ? { ...email, accountClassification: data.email.accountClassification } : email
      ));
      
      // Refresh email counts by classification
      fetchClassifications();
      
      showToast('Email classification updated successfully', 'success');
    } catch (err) {
      showToast('Failed to update email classification', 'error');
      console.error('Error updating email classification:', err);
    }
  };

  const deactivateEmail = async (emailId: number | string) => {
    // Debug: Check if emailId is valid
    console.log('Deactivating email ID:', emailId);
    if (!emailId) {
      showToast('Invalid email ID', 'error');
      return;
    }
    
    try {
      const response = await apiClient.put(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/emails/${emailId}/deactivate`, {});
      
      if (!response.ok) {
        throw new Error('Failed to deactivate email');
      }
      
      const data = await response.json();
      // Update email in state
      setEmails(emails.map(email => 
        email._id === emailId ? { ...email, isActive: data.email.isActive } : email
      ));
      
      showToast('Email deactivated successfully', 'success');
    } catch (err) {
      showToast('Failed to deactivate email', 'error');
      console.error('Error deactivating email:', err);
    }
  };

  const updateEmailConnectionStatus = async (emailId: number | string, isConnected: boolean) => {
    // Debug: Check if emailId is valid
    console.log('Updating email connection status for ID:', emailId, 'to:', isConnected);
    if (!emailId) {
      showToast('Invalid email ID', 'error');
      return;
    }
    
    try {
      const response = await apiClient.put(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/emails/${emailId}/connection-status`, { isConnected });
      
      if (!response.ok) {
        throw new Error('Failed to update email connection status');
      }
      
      const data = await response.json();
      // Update email in state
      setEmails(emails.map(email => 
        email._id === emailId ? { ...email, isConnected: data.user.isConnected } : email
      ));
      
      showToast(`Email ${isConnected ? 'connected' : 'disconnected'} successfully`, 'success');
    } catch (err) {
      showToast('Failed to update email connection status', 'error');
      console.error('Error updating email connection status:', err);
    }
  };

  // Send magic link to email
  const sendMagicLink = async (email: Email) => {
    try {
      const response = await apiClient.post(`${process.env.NEXT_PUBLIC_API_URL}/api/magic-link/generate`, { email: email.email });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to generate magic link');
      }
      
      const data = await response.json();
      console.log('Magic link generated:', data);
      
      // Set the magic link in state and show the modal
      setMagicLink(data.magicLink);
      setSelectedEmailForMagicLink(email);
      setShowMagicLinkModal(true);
    } catch (err: any) {
      showToast(`Failed to generate magic link: ${err.message}`, 'error');
      console.error('Error generating magic link:', err);
    }
  };

  // Create and automatically open magic link for inbox access
  const createAndOpenMagicLink = async (email: Email) => {
    try {
      const response = await apiClient.post(`${process.env.NEXT_PUBLIC_API_URL}/api/magic-link/generate`, { email: email.email });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to generate magic link');
      }
      
      const data = await response.json();
      console.log('Magic link generated for auto-open:', data);
      
      // Automatically open the magic link in a new tab
      window.open(data.magicLink, '_blank');
      
      showToast('Magic link created and opened successfully', 'success');
    } catch (err: any) {
      showToast(`Failed to generate and open magic link: ${err.message}`, 'error');
      console.error('Error generating magic link:', err);
    }
  };

  // Filter emails based on search term, selected domain and classification
  const filteredEmails = emails.filter(email => {
    // Search filter - check if search term matches username, email, or domain
    const searchMatch = searchTerm === '' || 
      email.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (email.domain && email.domain.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (email.accountClassification && email.accountClassification.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const domainMatch = selectedDomain === 'all' || email.domain === selectedDomain;
    const classificationMatch = selectedClassification === 'all' || email.accountClassification === selectedClassification;
    
    return searchMatch && domainMatch && classificationMatch;
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
      {/* Create Email Modal */}
      <Modal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        title="Create New Email"
        size="lg"
      >
        <form onSubmit={handleCreateEmail} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">Username</label>
              <input
                type="text"
                value={newEmail.username}
                onChange={(e) => setNewEmail({...newEmail, username: e.target.value})}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground transition-all duration-200"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">Password</label>
              <input
                type="password"
                value={newEmail.password}
                onChange={(e) => setNewEmail({...newEmail, password: e.target.value})}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground transition-all duration-200"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1">Domain (optional)</label>
              <select
                value={newEmail.domain}
                onChange={(e) => setNewEmail({...newEmail, domain: e.target.value})}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground transition-all duration-200"
              >
                <option value="">Select a domain</option>
                {domains.map((domain) => (
                  <option key={domain.domain} value={domain.domain}>
                    {domain.domain} {domain.isDefault ? '(Default)' : ''}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground/80 mb-1">Account Classification (optional)</label>
              <div className="flex space-x-2">
                <select
                  value={newEmail.accountClassification || ''}
                  onChange={(e) => setNewEmail({...newEmail, accountClassification: e.target.value})}
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
              {newEmail.accountClassification && !classifications.includes(newEmail.accountClassification) && (
                <div className="mt-2 text-sm text-destructive">
                  Classification does not exist: <strong>{newEmail.accountClassification}</strong>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button 
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 transform hover:scale-105"
            >
              Create Email
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

      {/* Magic Link Modal */}
      <Modal
        isOpen={showMagicLinkModal}
        onClose={() => setShowMagicLinkModal(false)}
        title={`Magic Link for ${selectedEmailForMagicLink?.username}`}
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-foreground/80">
            A magic link has been generated for <strong>{selectedEmailForMagicLink?.email}</strong>. 
            Copy the link below and send it to the email owner. The link will expire in 1 year.
          </p>
          
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
            <p className="text-foreground font-mono break-all">{magicLink}</p>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                navigator.clipboard.writeText(magicLink);
                showToast('Magic link copied to clipboard', 'success');
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200"
            >
              Copy Link
            </button>
            <button
              onClick={() => setShowMagicLinkModal(false)}
              className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-accent transition-all duration-200 text-foreground"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fadeInSlideDown">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Email Management</h1>
          <p className="text-foreground/70">Manage all email accounts in the system</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button 
            onClick={() => {
              const event = new CustomEvent('openCreateEmailModal');
              window.dispatchEvent(event);
            }}
            className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-accent transition-all duration-200 text-foreground transform hover:scale-105"
          >
            Create New Email
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1">Search Emails</label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by username, domain, or classification..."
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground transition-all duration-200 pr-10"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5 text-foreground/50 hover:text-foreground"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
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

      {/* Emails Table */}
      <div className="bg-card rounded-xl shadow-sm border border-border animate-fadeInSlideUp delay-150">
        <div className="p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold text-foreground">Emails List</h2>
            <p className="text-sm text-foreground/70">
              Showing {filteredEmails.length} of {emails.length} emails
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
                  <th className="px-4 py-2 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider">Connection</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {filteredEmails.map((email) => (
                  <tr key={email._id} className="hover:bg-accent/50 transition-colors duration-150">
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="font-medium text-foreground text-sm"> {email.username}</div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="text-foreground/70 text-sm">{email.username}@{email.domain}</div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="text-foreground/70 text-sm">
                        {email.domain || '-'}
                        {email.isDefaultDomain && (
                          <span className="ml-1 px-1.5 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <select
                          value={email.accountClassification || ''}
                          onChange={(e) => {
                            console.log('Classification change for email:', email._id, 'to:', e.target.value);
                            updateEmailClassification(email._id, e.target.value);
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
                        email.isActive 
                          ? 'bg-green-500/10 text-green-500' 
                          : 'bg-destructive/10 text-destructive'
                      }`}>
                        {email.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                        email.isConnected 
                          ? 'bg-green-500/10 text-green-500' 
                          : 'bg-yellow-500/10 text-yellow-500'
                      }`}>
                        {email.isConnected ? 'Connected' : 'Disconnected'}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {email.isActive ? (
                          <button
                            onClick={() => {
                              console.log('Deactivating email:', email._id);
                              deactivateEmail(email._id);
                            }}
                            className="p-1 text-destructive hover:bg-destructive/20 rounded transition-colors duration-200"
                            title="Deactivate email"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                            </svg>
                          </button>
                        ) : (
                          <button
                            disabled
                            className="p-1 text-foreground/50 cursor-not-allowed"
                            title="Inactive email"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                            </svg>
                          </button>
                        )}
                        
                        <button
                          onClick={() => {
                            // Open email login for this email
                            window.open(`/login?email=${encodeURIComponent(email.email)}`, '_blank');
                          }}
                          className="p-1 text-purple-500 hover:bg-purple-500/20 rounded transition-colors duration-200"
                          title="Login as email owner"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                          </svg>
                        </button>
                        
                        <button
                          onClick={() => {
                            // Create and open magic link for inbox access
                            createAndOpenMagicLink(email);
                          }}
                          className="p-1 text-indigo-500 hover:bg-indigo-500/20 rounded transition-colors duration-200"
                          title="View inbox via magic link"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                        </button>
                        
                        <button
                          onClick={() => sendMagicLink(email)}
                          className="p-1 text-blue-500 hover:bg-blue-500/20 rounded transition-colors duration-200"
                          title="Send magic link"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                        </button>
                        
                        {/* Connection status toggle */}
                        <button
                          onClick={() => updateEmailConnectionStatus(email._id, !email.isConnected)}
                          className={`p-1 rounded transition-colors duration-200 ${email.isConnected ? 'text-yellow-500 hover:bg-yellow-500/20' : 'text-green-500 hover:bg-green-500/20'}`}
                          title={email.isConnected ? 'Mark as disconnected' : 'Mark as connected'}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {email.isConnected ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                            )}
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredEmails.length === 0 && (
              <div className="text-center py-8 text-foreground/50">
                No emails found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}