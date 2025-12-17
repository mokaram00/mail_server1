'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Email {
  id: number;
  subject: string;
  body: string;
  isRead: boolean;
  isStarred: boolean;
  folder: string;
  messageId?: string;
  fromAddress?: string;
  toAddress?: string;
  receivedAt?: string;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: number;
    username: string;
    email: string;
  };
  recipient: {
    id: number;
    username: string;
    email: string;
  };
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalEmails: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function EmailsByClassification() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [classifications, setClassifications] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [selectedClassification, setSelectedClassification] = useState<string>('');
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 0,
    totalEmails: 0,
    hasNextPage: false,
    hasPrevPage: false
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
    
    // Fetch classifications
    fetchClassifications(storedToken);
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
    }
  };

  const fetchEmailsByClassification = async (authToken: string, classification: string, page: number = 1) => {
    if (!classification) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/emails/classification/${classification}?page=${page}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch emails');
      }
      
      const data = await response.json();
      setEmails(data.emails);
      setPagination(data.pagination);
    } catch (err) {
      setError('Failed to load emails');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClassificationChange = (classification: string) => {
    setSelectedClassification(classification);
    if (token) {
      fetchEmailsByClassification(token, classification);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (token && selectedClassification) {
      fetchEmailsByClassification(token, selectedClassification, newPage);
    }
  };

  if (loading && emails.length === 0) {
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

      <h1 className="text-3xl font-bold mb-8">Emails by Classification</h1>

      {/* Classification Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Select Classification</label>
        <select
          value={selectedClassification}
          onChange={(e) => handleClassificationChange(e.target.value)}
          className="px-3 py-2 border border-foreground/20 rounded bg-background"
        >
          <option value="">Select a classification</option>
          {classifications.map((classification) => (
            <option key={classification} value={classification}>
              {classification}
            </option>
          ))}
        </select>
      </div>

      {/* Email List */}
      {selectedClassification && (
        <div className="bg-card border border-foreground/20 rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-foreground/20">
            <h2 className="text-xl font-semibold">
              Emails for Classification: {selectedClassification}
            </h2>
            <p className="text-sm text-foreground/80 mt-1">
              Showing {emails.length} of {pagination.totalEmails} emails
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-foreground/20">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">From</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">To</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/20">
                {emails.map((email) => (
                  <tr key={email.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium">{email.sender.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-foreground/80">{email.recipient.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{email.subject}</div>
                      <div className="text-sm text-foreground/80 truncate max-w-xs">
                        {email.body.substring(0, 50)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-foreground/80">
                        {new Date(email.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {email.isRead ? (
                          <span className="px-2 py-1 bg-green-500/20 text-green-500 text-xs rounded">
                            Read
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-500 text-xs rounded">
                            Unread
                          </span>
                        )}
                        {email.isStarred && (
                          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 text-xs rounded">
                            Starred
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                
                {emails.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-foreground/60">
                      No emails found for this classification
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-foreground/20 flex items-center justify-between">
              <div className="text-sm text-foreground/80">
                Page {pagination.currentPage} of {pagination.totalPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                  className={`px-3 py-1 rounded ${
                    pagination.hasPrevPage
                      ? 'bg-foreground text-background hover:bg-muted'
                      : 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className={`px-3 py-1 rounded ${
                    pagination.hasNextPage
                      ? 'bg-foreground text-background hover:bg-muted'
                      : 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}