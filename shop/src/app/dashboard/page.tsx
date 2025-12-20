'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
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

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [accounts, setAccounts] = useState<PurchasedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [magicLinks, setMagicLinks] = useState<{[key: string]: string}>({});
  const [generatingLink, setGeneratingLink] = useState<{[key: string]: boolean}>({});

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch purchased accounts
  useEffect(() => {
    if (user) {
      fetchPurchasedAccounts();
    }
  }, [user]);

  const fetchPurchasedAccounts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getUserPurchasedAccounts();
      
      if (response.accounts) {
        setAccounts(response.accounts);
      }
    } catch (err) {
      console.error('Error fetching purchased accounts:', err);
      setError('Failed to load purchased accounts');
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
      setError('Failed to generate magic link');
    } finally {
      setGeneratingLink(prev => ({ ...prev, [productId]: false }));
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="p-4 bg-destructive/20 border border-destructive rounded-lg text-destructive animate-shake">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
            Account Dashboard
          </h1>
          <p className="mt-3 text-xl text-foreground/70">
            Manage your purchased accounts and access them securely
          </p>
        </div>

        {accounts.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-foreground">No accounts purchased</h3>
            <p className="mt-1 text-sm text-foreground/70">
              You haven't purchased any accounts yet.
            </p>
            <div className="mt-6">
              <button
                onClick={() => router.push('/products')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200"
              >
                Browse Products
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => (
              <div key={`${account.orderId}-${account.product._id}`} className="bg-card rounded-xl shadow-sm border border-foreground/10 overflow-hidden transition-all duration-300 hover:shadow-lg">
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
                          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                            generatingLink[account.product._id] 
                              ? 'bg-foreground/50 cursor-not-allowed' 
                              : 'bg-primary hover:bg-primary/90'
                          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200`}
                        >
                          {generatingLink[account.product._id] ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
                        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                          generatingLink[account.product._id] 
                            ? 'bg-foreground/50 cursor-not-allowed' 
                            : 'bg-primary hover:bg-primary/90'
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200`}
                      >
                        {generatingLink[account.product._id] ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
    </div>
  );
}
