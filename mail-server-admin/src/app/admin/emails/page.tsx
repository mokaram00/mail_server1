'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../utils/apiClient';

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
  const [selectedClassification, setSelectedClassification] = useState<string>('');
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 0,
    totalEmails: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const router = useRouter();

  // Fetch classifications
  useEffect(() => {
    fetchClassifications();
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
      setError('Failed to load classifications');
      console.error(err);
    }
  };

  const fetchEmailsByClassification = async (classification: string, page: number = 1) => {
    if (!classification) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/emails/classification/${classification}?page=${page}&limit=10`);
      
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
    fetchEmailsByClassification(classification);
  };

  const handlePageChange = (newPage: number) => {
    if (selectedClassification) {
      fetchEmailsByClassification(selectedClassification, newPage);
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
    <div className="min-h-screen bg-background text-foreground animate-fadeIn">
      {error && (
        <div className="mb-6 p-4 bg-destructive/20 border border-destructive rounded-lg text-destructive animate-shake">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-6 p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-500 animate-bounceIn">
          {success}
        </div>
      )}

      <h1 className="text-2xl font-bold mb-6 animate-fadeInSlideDown">Emails by Classification</h1>

      {/* Classification Selector */}
      <div className="mb-6 animate-fadeInSlideDown">
        <label className="block text-sm font-medium mb-2 text-foreground/80">Select Classification</label>
        <select
          value={selectedClassification}
          onChange={(e) => handleClassificationChange(e.target.value)}
          className="px-3 py-2 border border-border rounded bg-background text-foreground transition-all duration-200"
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
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden animate-fadeInSlideUp delay-100">
          <div className="px-5 py-3 border-b border-border">
            <h2 className="text-base font-semibold text-foreground">
              Emails for Classification: {selectedClassification}
            </h2>
            <p className="text-xs text-foreground/70 mt-1">
              Showing {emails.length} of {pagination.totalEmails} emails
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-accent">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider">From</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider">To</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider">Subject</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {emails.map((email) => (
                  <tr key={email.id} className="hover:bg-accent/50 transition-colors duration-150">
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="font-medium text-foreground text-xs">{email.sender.email}</div>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="text-foreground/70 text-xs">{email.recipient.email}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-foreground text-xs">{email.subject}</div>
                      <div className="text-xs text-foreground/70 truncate max-w-xs">
                        {email.body.substring(0, 30)}...
                      </div>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="text-foreground/70 text-xs">
                        {new Date(email.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        {email.isRead ? (
                          <span className="px-1.5 py-0.5 bg-green-500/10 text-green-500 text-xs rounded">
                            Read
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-500 text-xs rounded">
                            Unread
                          </span>
                        )}
                        {email.isStarred && (
                          <span className="px-1.5 py-0.5 bg-yellow-500/10 text-yellow-500 text-xs rounded">
                            Starred
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                
                {emails.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-foreground/50 text-sm">
                      No emails found for this classification
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-5 py-3 border-t border-border flex items-center justify-between">
              <div className="text-xs text-foreground/70">
                Page {pagination.currentPage} of {pagination.totalPages}
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                  className={`px-2.5 py-1 rounded text-xs ${
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
                  className={`px-2.5 py-1 rounded text-xs ${
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