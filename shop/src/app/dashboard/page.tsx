'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';

interface PurchasedAccount {
  orderId: string;
  orderDate: string;
  product: {
    _id: string;
    name: string;
    description: string;
    price: number;
  };
  quantity: number;
}

interface UserProfile {
  _id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  emailVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ fullName: '' });
  const [accounts, setAccounts] = useState<PurchasedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [magicLinks, setMagicLinks] = useState<{[key: string]: string}>({});
  const [generatingLink, setGeneratingLink] = useState<{[key: string]: boolean}>({});

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await apiClient.getProfile();
        if (response.user) {
          setProfile(response.user);
          setProfileForm({ fullName: response.user.fullName || '' });
        } else {
          // No user data, redirect to login
          router.push('/login');
        }
      } catch (err) {
        // Error fetching profile, likely not authenticated
        console.error('Auth check failed:', err);
        router.push('/login');
      } finally {
        setProfileLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Fetch purchased accounts
  useEffect(() => {
    if (profile) {
      fetchPurchasedAccounts();
    }
  }, [profile]);

  const fetchPurchasedAccounts = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      const response = await apiClient.getUserPurchasedAccounts();
      
      if (response.accounts) {
        setAccounts(response.accounts);
      }
    } catch (err: any) {
      console.error('Error fetching purchased accounts:', err);
      // Handle the specific MongoDB timeout error
      if (err.message && err.message.includes('buffering timed out')) {
        setError('Database connection is temporarily slow. Please try again in a moment.');
      } else {
        setError('Failed to load purchased accounts. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const generateMagicLink = async (productId: string) => {
    try {
      setGeneratingLink(prev => ({ ...prev, [productId]: true }));
      
      const response = await apiClient.generateAccountMagicLink(productId);
      
      if (response.magicLink) {
        setMagicLinks(prev => ({ ...prev, [productId]: response.magicLink || '' }));
      }
    } catch (err) {
      console.error('Error generating magic link:', err);
      setError('Failed to generate magic link. Please try again.');
    } finally {
      setGeneratingLink(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handleProfileUpdate = async () => {
    try {
      // We'll implement profile update functionality here
      // For now, we'll just toggle the editing state
      setEditingProfile(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md p-6 bg-card rounded-xl border border-foreground/10 shadow-lg">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">Something went wrong</h3>
            <p className="text-foreground/70 mb-6">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={fetchPurchasedAccounts}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.open('https://shop.bltnm.store', '_blank')}
                className="px-4 py-2 border border-foreground/20 rounded-lg hover:bg-foreground/5 transition-colors"
              >
                Browse Products
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8 pt-32">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section with Profile Info */}
        <div className="mb-12 animate-fadeIn">
          <div className="bg-card rounded-xl shadow-sm border border-foreground/10 p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/30">
                  <span className="text-2xl font-bold text-primary">
                    {profile?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="ml-4">
                  {editingProfile ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={profileForm.fullName}
                        onChange={(e) => setProfileForm({...profileForm, fullName: e.target.value})}
                        className="text-lg font-bold bg-background border border-foreground/20 rounded-lg px-3 py-1 w-full md:w-64"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleProfileUpdate}
                          className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingProfile(false);
                            setProfileForm({ fullName: profile?.fullName || '' });
                          }}
                          className="text-xs bg-foreground/10 px-2 py-1 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h1 className="text-2xl font-bold text-foreground">
                        {profile?.fullName || 'User'}
                      </h1>
                      <button
                        onClick={() => setEditingProfile(true)}
                        className="text-xs text-foreground/70 hover:text-foreground underline"
                      >
                        Edit profile
                      </button>
                    </>
                  )}
                  <p className="text-sm text-foreground/70 mt-1">
                    {profile?.email}
                  </p>
                </div>
              </div>
              
              <div className="mt-4 md:mt-0">
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-foreground/70">Member since</p>
                  <p className="font-medium">
                    {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Unknown'}
                  </p>
                  {profile?.lastLogin && (
                    <p className="text-xs text-foreground/70 mt-1">
                      Last login: {new Date(profile.lastLogin).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground">
              Your Dashboard
            </h2>
            <p className="mt-2 text-xl text-foreground/70">
              Manage your purchased accounts and access them securely
            </p>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-semibold text-foreground mb-4">Your Purchased Accounts</h3>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border border-foreground/10">
              <div className="mx-auto h-20 w-20 bg-gradient-to-br from-white to-gray-200 rounded-2xl shadow-xl flex items-center justify-center mb-6 animate-fadeIn">
                <svg className="h-10 w-10 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="mt-2 text-lg font-medium text-foreground animate-fadeIn">No accounts purchased</h3>
              <p className="mt-1 text-foreground/70 animate-fadeIn delay-100">
                You haven't purchased any accounts yet.
              </p>
              <div className="mt-6 animate-fadeIn delay-200">
                <button
                  onClick={() => window.open('https://shop.bltnm.store/products', '_blank')}
                  className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-xl text-black bg-gradient-to-r from-white to-gray-200 hover:from-gray-200 hover:to-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg"
                >
                  Browse Products
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {accounts.map((account) => (
                <div key={`${account.orderId}-${account.product._id}`} className="bg-card rounded-xl shadow-sm border border-foreground/10 overflow-hidden transition-all duration-300 hover:shadow-lg card-hover">
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-primary/10 rounded-lg p-3">
                        <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-foreground">{account.product.name}</h3>
                        <p className="text-sm text-foreground/70">
                          Purchased on {new Date(account.orderDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <p className="text-foreground/90">{account.product.description}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-lg font-bold text-foreground">${account.product.price.toFixed(2)}</span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          Quantity: {account.quantity}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      {magicLinks[account.product._id] ? (
                        <div className="space-y-3">
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm font-medium text-foreground">Your Magic Link:</p>
                            <a 
                              href={magicLinks[account.product._id]} 
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 text-sm text-primary hover:underline break-all"
                            >
                              {magicLinks[account.product._id]}
                            </a>
                          </div>
                          <button
                            onClick={() => generateMagicLink(account.product._id)}
                            disabled={generatingLink[account.product._id]}
                            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black ${
                              generatingLink[account.product._id] 
                                ? 'bg-foreground/50 cursor-not-allowed' 
                                : 'bg-gradient-to-r from-white to-gray-200 hover:from-gray-200 hover:to-white'
                            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-md`}
                          >
                            {generatingLink[account.product._id] ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                                Generating...
                              </>
                            ) : (
                              'Generate New Link'
                            )}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => generateMagicLink(account.product._id)}
                          disabled={generatingLink[account.product._id]}
                          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black ${
                            generatingLink[account.product._id] 
                              ? 'bg-foreground/50 cursor-not-allowed' 
                              : 'bg-gradient-to-r from-white to-gray-200 hover:from-gray-200 hover:to-white'
                          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-md`}
                        >
                          {generatingLink[account.product._id] ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                              Generating...
                            </>
                          ) : (
                            'Generate Access Link'
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="bg-card rounded-xl shadow-sm border border-foreground/10 p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Need Help?</h3>
          <p className="text-foreground/70 mb-4">
            If you're having trouble accessing your accounts or need assistance, please contact our support team.
          </p>
          <a
            href="https://bltnm.store/support"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}