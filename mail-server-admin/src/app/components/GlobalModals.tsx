'use client';

import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { apiClient } from '../utils/apiClient';

// Define types for our modals
type ModalType = 'createUser' | 'createBulkUsers' | 'generateEmails' | 'createDomain' | 'createClassification' | null;

interface GlobalModalsProps {
  children: React.ReactNode;
}

export default function GlobalModals({ children }: GlobalModalsProps) {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  
  // User form state
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: 'user',
    domain: '',
    isDefaultDomain: false,
    accountClassification: ''
  });
  
  // Bulk users form state
  const [bulkUsers, setBulkUsers] = useState('');
  
  // Generate emails form state
  const [generateEmailsData, setGenerateEmailsData] = useState({
    count: 5,
    domain: '',
    accountClassification: ''
  });
  
  // Generated users state
  const [generatedUsers, setGeneratedUsers] = useState<Array<{username: string, password: string}>>([]);
  
  // Domain form state
  const [newDomain, setNewDomain] = useState('');
  
  // Classification form state
  const [newClassification, setNewClassification] = useState('');
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data for selects
  const [domains, setDomains] = useState<{domain: string, isDefault: boolean}[]>([]);
  const [classifications, setClassifications] = useState<string[]>([]);
  
  // Load domains and classifications when user modal opens
  useEffect(() => {
    if (activeModal === 'createUser' || activeModal === 'createBulkUsers' || activeModal === 'generateEmails') {
      fetchDomainsAndClassifications();
    }
  }, [activeModal]);
  
  const fetchDomainsAndClassifications = async () => {
    try {
      // Fetch domains
      const domainsResponse = await apiClient.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/domains`);
      if (domainsResponse.ok) {
        const domainsData = await domainsResponse.json();
        setDomains(domainsData.domains);
        
        // Set default domain
        const defaultDomain = domainsData.domains.find((d: any) => d.isDefault);
        if (defaultDomain && activeModal === 'generateEmails') {
          setGenerateEmailsData(prev => ({...prev, domain: defaultDomain.domain}));
        } else if (defaultDomain) {
          setNewUser(prev => ({...prev, domain: defaultDomain.domain}));
        }
      }
      
      // Fetch classifications
      const classificationsResponse = await apiClient.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/classifications`);
      if (classificationsResponse.ok) {
        const classificationsData = await classificationsResponse.json();
        setClassifications(classificationsData.classifications.map((c: any) => c.classification));
      }
    } catch (err) {
      console.error('Failed to fetch domains and classifications:', err);
    }
  };

  // Listen for modal open events from anywhere in the app
  useEffect(() => {
    const openCreateUserModal = () => setActiveModal('createUser');
    const openCreateBulkUsersModal = () => setActiveModal('createBulkUsers');
    const openGenerateEmailsModal = () => setActiveModal('generateEmails');
    const openCreateDomainModal = () => setActiveModal('createDomain');
    const openCreateClassificationModal = () => setActiveModal('createClassification');

    window.addEventListener('openCreateUserModal', openCreateUserModal);
    window.addEventListener('openCreateBulkUsersModal', openCreateBulkUsersModal);
    window.addEventListener('openGenerateEmailsModal', openGenerateEmailsModal);
    window.addEventListener('openCreateDomainModal', openCreateDomainModal);
    window.addEventListener('openCreateClassificationModal', openCreateClassificationModal);

    return () => {
      window.removeEventListener('openCreateUserModal', openCreateUserModal);
      window.removeEventListener('openCreateBulkUsersModal', openCreateBulkUsersModal);
      window.removeEventListener('openGenerateEmailsModal', openGenerateEmailsModal);
      window.removeEventListener('openCreateDomainModal', openCreateDomainModal);
      window.removeEventListener('openCreateClassificationModal', openCreateClassificationModal);
    };
  }, []);

  // Function to generate random username
  const generateRandomUsername = () => {
    const adjectives = ['cool', 'fast', 'smart', 'bright', 'quick', 'bold', 'calm', 'deep', 'easy', 'fair'];
    const nouns = ['user', 'person', 'member', 'client', 'customer', 'visitor', 'guest', 'player', 'reader', 'writer'];
    const randomNumber = Math.floor(Math.random() * 1000);
    
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    
    return `${adjective}${noun}${randomNumber}`;
  };

  // Function to generate random password
  const generateRandomPassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  // Function to generate users
  const generateUsers = () => {
    const users = [];
    for (let i = 0; i < generateEmailsData.count; i++) {
      users.push({
        username: generateRandomUsername(),
        password: generateRandomPassword()
      });
    }
    setGeneratedUsers(users);
  };

  // Function to create generated users
  const createGeneratedUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Create users one by one
      for (const user of generatedUsers) {
        const userData = {
          username: user.username,
          password: user.password,
          role: 'user', // Default role
          domain: generateEmailsData.domain,
          accountClassification: generateEmailsData.accountClassification || ''
        };
        
        const response = await apiClient.post(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`, userData);
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || `Failed to create user ${user.username}`);
        }
      }
      
      (window as any).addToast(`Successfully created ${generatedUsers.length} users`, 'success');
      closeModal();
      
      // Dispatch event to update users list
      window.dispatchEvent(new CustomEvent('userCreated'));
    } catch (err: any) {
      (window as any).addToast(err.message || 'Failed to create users', 'error');
      setError(err.message || 'Failed to create users');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    // Reset form states when closing modal
    setNewUser({
      username: '',
      password: '',
      role: 'user',
      domain: '',
      isDefaultDomain: false,
      accountClassification: ''
    });
    setBulkUsers('');
    setGenerateEmailsData({
      count: 5,
      domain: '',
      accountClassification: ''
    });
    setGeneratedUsers([]);
    setNewDomain('');
    setNewClassification('');
    setError(null);
    setDomains([]);
    setClassifications([]);
  };

  return (
    <>
      {children}
      
      {/* Create User Modal */}
      <Modal
        isOpen={activeModal === 'createUser'}
        onClose={closeModal}
        title="Create New User"
        size="lg"
      >
        <form onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          setError(null);
          
          try {
            const response = await apiClient.post(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`, newUser);
            const data = await response.json();
            
            if (!response.ok) {
              throw new Error(data.message || 'Failed to create user');
            }
            
            (window as any).addToast('User created successfully', 'success');
            closeModal();
            
            // Dispatch event to update users list
            window.dispatchEvent(new CustomEvent('userCreated'));
          } catch (err: any) {
            (window as any).addToast(err.message || 'Failed to create user', 'error');
            setError(err.message || 'Failed to create user');
          } finally {
            setLoading(false);
          }
        }} className="space-y-4">
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
              <label className="block text-sm font-medium text-foreground/80 mb-1">Domain</label>
              <select
                value={newUser.domain}
                onChange={(e) => setNewUser({...newUser, domain: e.target.value})}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground transition-all duration-200"
              >
                <option value="">Select a domain</option>
                {domains.map((domain) => (
                  <option key={domain.domain} value={domain.domain}>
                    {domain.domain} {domain.isDefault && '(Default)'}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground/80 mb-1">Account Classification (optional)</label>
              <div className="flex space-x-2">
                <select
                  value={newUser.accountClassification}
                  onChange={(e) => setNewUser({...newUser, accountClassification: e.target.value})}
                  className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground transition-all duration-200"
                >
                  <option value="">Select classification or create new</option>
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
                    if (newClassification && newClassification.trim()) {
                      setNewUser({...newUser, accountClassification: newClassification.trim()});
                    }
                  }}
                  className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200"
                >
                  + New
                </button>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="p-3 bg-destructive/20 border border-destructive rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}
          
          <div className="flex space-x-3 pt-4">
            <button 
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
            <button 
              type="button"
              onClick={closeModal}
              className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-accent transition-all duration-200 text-foreground"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Bulk Users Modal */}
      <Modal
        isOpen={activeModal === 'createBulkUsers'}
        onClose={closeModal}
        title="Create Bulk Users"
        size="lg"
      >
        <form onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          setError(null);
          
          try {
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
            
            (window as any).addToast(`Successfully created ${usersArray.length} users`, 'success');
            closeModal();
            
            // Refresh the current page if it's the users page
            if (window.location.pathname === '/admin/users') {
              window.location.reload();
            }
          } catch (err: any) {
            (window as any).addToast(err.message || 'Failed to create users', 'error');
            setError(err.message || 'Failed to create users');
          } finally {
            setLoading(false);
          }
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1">Bulk Users Data</label>
            <textarea
              value={bulkUsers}
              onChange={(e) => setBulkUsers(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground transition-all duration-200 font-mono text-sm"
              rows={10}
              placeholder="Enter user data in CSV format (one user per line):
username,password,role,domain,accountClassification
john,password123,user,example.com,vip
jane,password456,admin,test.com,"
              required
            />
            <p className="text-xs text-foreground/70 mt-1">
              Format: username,password,role,domain,accountClassification (role, domain, and classification are optional)
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-foreground/80 mb-1">Available Domains</h3>
            <div className="flex flex-wrap gap-2">
              {domains.map((domain) => (
                <span key={domain.domain} className="px-2 py-1 bg-accent rounded text-xs">
                  {domain.domain} {domain.isDefault && '(Default)'}
                </span>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-foreground/80 mb-1">Available Classifications</h3>
            <div className="flex flex-wrap gap-2">
              {classifications.map((classification) => (
                <span key={classification} className="px-2 py-1 bg-accent rounded text-xs">
                  {classification}
                </span>
              ))}
            </div>
          </div>
          
          {error && (
            <div className="p-3 bg-destructive/20 border border-destructive rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}
          
          <div className="flex space-x-3 pt-4">
            <button 
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Bulk Users'}
            </button>
            <button 
              type="button"
              onClick={closeModal}
              className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-accent transition-all duration-200 text-foreground"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Generate Emails Modal */}
      <Modal
        isOpen={activeModal === 'generateEmails'}
        onClose={closeModal}
        title="Generate Email Accounts"
        size="lg"
      >
        {generatedUsers.length === 0 ? (
          <form onSubmit={(e) => {
            e.preventDefault();
            generateUsers();
          }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">Number of Accounts</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={generateEmailsData.count}
                  onChange={(e) => setGenerateEmailsData({...generateEmailsData, count: parseInt(e.target.value) || 1})}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground transition-all duration-200"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">Domain</label>
                <select
                  value={generateEmailsData.domain}
                  onChange={(e) => setGenerateEmailsData({...generateEmailsData, domain: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground transition-all duration-200"
                  required
                >
                  <option value="">Select a domain</option>
                  {domains.map((domain) => (
                    <option key={domain.domain} value={domain.domain}>
                      {domain.domain} {domain.isDefault && '(Default)'}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground/80 mb-1">Account Classification (optional)</label>
                <select
                  value={generateEmailsData.accountClassification}
                  onChange={(e) => setGenerateEmailsData({...generateEmailsData, accountClassification: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground transition-all duration-200"
                >
                  <option value="">Select classification</option>
                  {classifications.map((classification) => (
                    <option key={classification} value={classification}>
                      {classification}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {error && (
              <div className="p-3 bg-destructive/20 border border-destructive rounded-lg text-destructive text-sm">
                {error}
              </div>
            )}
            
            <div className="flex space-x-3 pt-4">
              <button 
                type="submit"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200"
              >
                Generate Accounts
              </button>
              <button 
                type="button"
                onClick={closeModal}
                className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-accent transition-all duration-200 text-foreground"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="bg-accent/50 rounded-lg p-4">
              <h3 className="font-medium text-foreground mb-2">Generated Accounts</h3>
              <p className="text-sm text-foreground/80 mb-3">
                {generatedUsers.length} accounts will be created with the following details:
              </p>
              <div className="text-sm">
                <p><span className="font-medium">Domain:</span> {generateEmailsData.domain}</p>
                {generateEmailsData.accountClassification && (
                  <p><span className="font-medium">Classification:</span> {generateEmailsData.accountClassification}</p>
                )}
              </div>
            </div>
            
            <div className="max-h-60 overflow-y-auto border border-border rounded-lg">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-accent">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-foreground/70 uppercase">Username</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-foreground/70 uppercase">Password</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {generatedUsers.map((user, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm text-foreground">{user.username}</td>
                      <td className="px-4 py-2 text-sm text-foreground font-mono">{user.password}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {error && (
              <div className="p-3 bg-destructive/20 border border-destructive rounded-lg text-destructive text-sm">
                {error}
              </div>
            )}
            
            <div className="flex space-x-3 pt-4">
              <button 
                onClick={createGeneratedUsers}
                disabled={loading}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Confirm & Create All Accounts'}
              </button>
              <button 
                onClick={() => setGeneratedUsers([])}
                className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-accent transition-all duration-200 text-foreground"
              >
                Regenerate
              </button>
              <button 
                onClick={closeModal}
                className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-accent transition-all duration-200 text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Domain Modal */}
      <Modal
        isOpen={activeModal === 'createDomain'}
        onClose={closeModal}
        title="Create New Domain"
      >
        <form onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          setError(null);
          
          try {
            const response = await apiClient.post(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/domains`, { domain: newDomain });
            const data = await response.json();
            
            if (!response.ok) {
              throw new Error(data.message || 'Failed to add domain');
            }
            
            (window as any).addToast(data.message || 'Domain added successfully', 'success');
            closeModal();
            
            // Dispatch event to update domains list
            window.dispatchEvent(new CustomEvent('domainCreated'));
          } catch (err: any) {
            (window as any).addToast(err.message || 'Failed to add domain', 'error');
            setError(err.message || 'Failed to add domain');
          } finally {
            setLoading(false);
          }
        }} className="space-y-4">
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
            <p className="text-xs text-foreground/70 mt-1">Enter a valid domain name like "example.com"</p>
          </div>
          
          {error && (
            <div className="p-3 bg-destructive/20 border border-destructive rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}
          
          <div className="flex space-x-3 pt-4">
            <button 
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Domain'}
            </button>
            <button 
              type="button"
              onClick={closeModal}
              className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-accent transition-all duration-200 text-foreground"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Classification Modal */}
      <Modal
        isOpen={activeModal === 'createClassification'}
        onClose={closeModal}
        title="Create New Classification"
      >
        <form onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          setError(null);
          
          try {
            const response = await apiClient.post(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/classifications`, { classification: newClassification });
            const data = await response.json();
            
            if (!response.ok) {
              throw new Error(data.message || 'Failed to add classification');
            }
            
            (window as any).addToast(data.message || 'Classification added successfully', 'success');
            closeModal();
            
            // Dispatch event to update classifications list
            window.dispatchEvent(new CustomEvent('classificationCreated'));
          } catch (err: any) {
            (window as any).addToast(err.message || 'Failed to add classification', 'error');
            setError(err.message || 'Failed to add classification');
          } finally {
            setLoading(false);
          }
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1">Classification Name</label>
            <input
              type="text"
              value={newClassification}
              onChange={(e) => setNewClassification(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground transition-all duration-200"
              placeholder="vip, premium, etc."
              required
            />
            <p className="text-xs text-foreground/70 mt-1">Enter a classification name like "vip", "premium", "rockstar", etc.</p>
          </div>
          
          {error && (
            <div className="p-3 bg-destructive/20 border border-destructive rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}
          
          <div className="flex space-x-3 pt-4">
            <button 
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Classification'}
            </button>
            <button 
              type="button"
              onClick={closeModal}
              className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-accent transition-all duration-200 text-foreground"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}