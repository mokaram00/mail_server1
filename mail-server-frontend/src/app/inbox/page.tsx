'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '../components/ThemeToggle';
import apiClient from '../components/apiClient';
import useWebSocket from '../components/useWebSocket';

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
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

  const toggleStar = async (id: string) => {
    try {
      const email = emails.find(email => email._id === id);
      if (email) {
        // In a real implementation, you would update the email on the server
        setEmails(emails.map(email => 
          email._id === id ? { ...email, isStarred: !email.isStarred } : email
        ));
      }
    } catch (err) {
      console.error('Error toggling star:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading emails...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-foreground shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="mr-4 text-foreground hover:text-muted transition-colors duration-300 lg:hidden"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-foreground animate-fadeIn">Inbox</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-foreground hover:text-muted transition-colors duration-300 relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-foreground animate-pulse"></span>
            </button>
            <ThemeToggle />
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-foreground flex items-center justify-center animate-fadeIn">
                <span className="text-sm font-bold text-background">U</span>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="text-sm text-foreground hover:text-muted transition-colors duration-300"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-foreground shadow-lg transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:z-auto lg:flex lg:w-64 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <nav className="mt-8 px-4">
            <ul className="space-y-2">
              {[
                { name: 'Inbox', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', count: emails.filter(e => !e.isRead).length, active: true },
                { name: 'Drafts', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', count: 0 },
                { name: 'Saved', icon: 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z', count: 0 },
                { name: 'Snoozed', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', count: 0 },
                { name: 'Sent', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z', count: 0 },
                { name: 'Trash', icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16', count: 0 }
              ].map((item, index) => (
                <li key={index} className="animate-fadeInSlideRight" style={{ animationDelay: `${index * 50}ms` }}>
                  <a 
                    href="#" 
                    className={`flex items-center p-3 text-base font-medium rounded-lg transition-all duration-300 group ${
                      item.active 
                        ? 'text-background bg-foreground' 
                        : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-foreground group-hover:text-muted transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                    <span className="ml-3">{item.name}</span>
                    {item.count > 0 && (
                      <span className="ml-auto bg-foreground text-background text-xs font-medium px-2 py-0.5 rounded-full">
                        {item.count}
                      </span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 transition-all duration-300 lg:ml-64">
          <div className="mb-6 animate-fadeInSlideDown">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-foreground">Inbox</h2>
                <p className="text-foreground mt-1">{emails.filter(e => !e.isRead).length} unread messages</p>
                {connected && (
                  <p className="text-green-500 text-sm mt-1">Real-time updates enabled</p>
                )}
              </div>
              <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-foreground text-background hover:bg-muted h-10 px-4 py-2 hover:scale-[1.02] active:scale-[0.98]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Compose
              </button>
            </div>
          </div>

          {/* Email List */}
          <div className="bg-card rounded-xl border border-foreground shadow-lg overflow-hidden animate-fadeInSlideUp">
            <ul className="divide-y divide-foreground">
              {emails.map((email, index) => (
                <li 
                  key={email._id} 
                  className={`p-4 hover:bg-muted cursor-pointer transition-all duration-300 ${
                    !email.isRead ? 'bg-foreground/5 border-l-4 border-foreground' : ''
                  } animate-fadeInSlideRight`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="h-4 w-4 text-foreground focus:ring-foreground border-foreground rounded"
                    />
                    <button 
                      onClick={() => toggleStar(email._id)}
                      className="ml-4 text-foreground hover:text-foreground transition-colors duration-300"
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-5 w-5 ${email.isStarred ? 'text-foreground fill-current' : ''}`} 
                        fill={email.isStarred ? "currentColor" : "none"} 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </button>
                    <div className="ml-4 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium truncate ${email.isRead ? 'text-foreground' : 'text-foreground font-bold'}`}>
                          {email.fromAddress || 'Unknown Sender'}
                        </p>
                        <div className="flex items-center space-x-2">
                          <p className="text-sm text-foreground">
                            {new Date(email.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <button className="text-foreground hover:text-foreground transition-colors duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <p className={`text-sm truncate ${email.isRead ? 'text-foreground' : 'text-foreground font-medium'}`}>
                        {email.subject}
                      </p>
                      <p className="text-sm text-foreground truncate">
                        {email.body.substring(0, 100)}...
                      </p>
                    </div>
                  </div>
                </li>
              ))}
              {emails.length === 0 && (
                <li className="p-8 text-center text-foreground">
                  <p>No emails found in your inbox.</p>
                </li>
              )}
            </ul>
          </div>
        </main>
      </div>
    </div>
  );
}