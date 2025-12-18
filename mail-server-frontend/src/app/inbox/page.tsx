'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '../components/ThemeToggle';
import apiClient from '../components/apiClient';
import useWebSocket from '../components/useWebSocket';
import EmailList from '../components/EmailList';
import EmailDetail from '../components/EmailDetail';

interface Email {
  _id: string;
  senderId: string;
  recipientId: string;
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
}

export default function Inbox() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Email[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const router = useRouter();
  
  // Initialize WebSocket connection
  const { socket, connected } = useWebSocket(userId);

  // Fetch user profile and emails when component mounts
  useEffect(() => {
    const initialize = async () => {
      try {
        // Get user profile
        const profileResponse = await apiClient.getProfile();
        if (profileResponse.user) {
          setUserId(profileResponse.user.id);
        }
        
        // Fetch initial emails
        const emailResponse = await apiClient.getEmails();
        if (emailResponse.emails) {
          setEmails(emailResponse.emails);
        }
      } catch (err) {
        setError('Failed to initialize inbox');
        console.error('Error initializing inbox:', err);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  // Set up WebSocket listeners
  useEffect(() => {
    if (!socket) return;

    // Listen for new emails
    socket.on('newEmail', (newEmail: Email) => {
      console.log('New email received:', newEmail);
      setEmails(prevEmails => [newEmail, ...prevEmails]);
      setNotifications(prev => [newEmail, ...prev.slice(0, 4)]); // Keep only last 5 notifications
    });

    // Clean up listener
    return () => {
      socket.off('newEmail');
    };
  }, [socket]);

  // Set up periodic email checking
  useEffect(() => {
    // Set up interval for real-time checking (every 30 seconds)
    const interval = setInterval(() => {
      if (!loading) {
        apiClient.checkNewEmails().then(response => {
          if (response.emails) {
            setEmails(response.emails);
          }
        }).catch(err => {
          console.error('Error checking for new emails:', err);
        });
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [loading]);

  const handleLogout = () => {
    apiClient.logout().then(() => {
      router.push('/login');
    });
  };

  const handleEmailSelect = async (email: Email) => {
    try {
      // Fetch the full email details from the backend
      const response = await apiClient.getEmailById(email._id);
      
      if (response.email) {
        setSelectedEmail(response.email);
        
        // Update the email in the list to mark it as read
        setEmails(emails.map(e => 
          e._id === email._id ? { ...e, isRead: true } : e
        ));
      }
    } catch (err) {
      console.error('Error fetching email:', err);
      setSelectedEmail(email); // Fallback to selecting the email anyway
      
      // Update the email in the list to mark it as read
      setEmails(emails.map(e => 
        e._id === email._id ? { ...e, isRead: true } : e
      ));
    }
  };

  const handleBackToInbox = () => {
    setSelectedEmail(null);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground animate-pulse">Loading emails...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded animate-shake">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Side Header */}
      <aside className="w-64 bg-card border-r border-foreground flex flex-col">
        <div className="p-4 border-b border-foreground">
          <h1 className="text-2xl font-bold text-foreground animate-fadeIn">Email Inbox</h1>
        </div>
        
        <div className="flex-1 p-4">
          <div className="mb-6 animate-fadeInSlideRight">
            <h2 className="text-lg font-semibold text-foreground mb-2">Inbox</h2>
            <p className="text-foreground text-sm">
              {emails.filter(e => !e.isRead).length} unread messages
              {connected && (
                <span className="text-green-500 text-xs ml-2">• Live</span>
              )}
            </p>
          </div>
        </div>
        
        <div className="p-4 border-t border-foreground">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-foreground flex items-center justify-center animate-bounceIn">
                <span className="text-sm font-bold text-background">
                  {emails.length > 0 ? emails[0].fromAddress?.charAt(0) || 'U' : 'U'}
                </span>
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-foreground">User</div>
              </div>
            </div>
            
            <div className="relative">
              <button 
                onClick={toggleNotifications}
                className="text-foreground hover:text-muted transition-colors duration-300 relative"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                    {notifications.length}
                  </span>
                )}
              </button>
              
              {/* Notifications dropdown */}
              {showNotifications && notifications.length > 0 && (
                <div className="absolute bottom-full right-0 mb-2 w-80 bg-card border border-foreground rounded-lg shadow-lg z-20 animate-fadeInSlideUp">
                  <div className="p-3 border-b border-foreground flex justify-between items-center">
                    <h3 className="font-semibold text-foreground">New Emails</h3>
                    <button 
                      onClick={clearNotifications}
                      className="text-sm text-foreground hover:text-muted"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {notifications.map(notification => (
                      <div 
                        key={notification._id} 
                        className="p-3 border-b border-foreground hover:bg-muted cursor-pointer transition-all duration-200"
                        onClick={() => {
                          handleEmailSelect(notification);
                          setShowNotifications(false);
                        }}
                      >
                        <div className="font-medium text-foreground truncate">
                          {notification.subject}
                        </div>
                        <div className="text-sm text-foreground truncate">
                          {notification.fromAddress || 'Unknown Sender'}
                        </div>
                        <div className="text-xs text-foreground">
                          {new Date(notification.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-between">
            <ThemeToggle />
            <button 
              onClick={handleLogout}
              className="text-sm text-foreground hover:text-muted transition-colors duration-300"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex">
        {/* Email List Section */}
        <div className={`${selectedEmail ? 'w-1/3' : 'w-full'} border-r border-foreground flex flex-col`}>
          <div className="flex-1 flex flex-col">
            <div className="mb-6 p-4 border-b border-foreground">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Inbox</h2>
                  <p className="text-foreground mt-1">
                    {emails.filter(e => !e.isRead).length} unread messages
                    {connected && (
                      <span className="text-green-500 text-sm ml-2">• Live</span>
                    )}
                  </p>
                </div>
              </div>
              {/* Search Bar */}
              <div className="mt-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search emails..."
                    className="w-full px-4 py-2 bg-background border border-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <svg 
                    className="absolute right-3 top-2.5 h-5 w-5 text-foreground/50" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <EmailList 
              emails={emails} 
              onSelectEmail={handleEmailSelect} 
              searchTerm={searchTerm}
            />
          </div>
        </div>
        
        {/* Email Detail Section */}
        {selectedEmail && (
          <div className="w-2/3 flex flex-col">
            <EmailDetail 
              email={selectedEmail} 
              onBack={handleBackToInbox} 
            />
          </div>
        )}
      </main>
    </div>
  );
}