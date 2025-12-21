'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '../components/ThemeToggle';
import apiClient from '../components/apiClient';
import useWebSocket from '../components/useWebSocket';
import { CopyButton } from '../components/CopyButton';
import DOMPurify from 'dompurify';
import parse from 'html-react-parser';

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

interface User {
  _id: string;
  username: string;
  email: string;
  magicLinkExpiresAt?: string;
}

export default function Inbox() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isMobileMenuAnimating, setIsMobileMenuAnimating] = useState(false);
  const [isEmailOpening, setIsEmailOpening] = useState(false);
  const [isEmailClosing, setIsEmailClosing] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isEmailSwitching, setIsEmailSwitching] = useState(false);
  const [navigationDirection, setNavigationDirection] = useState<'forward' | 'backward'>('forward');
  const [isSearching, setIsSearching] = useState(false);
  const [previousSearchTerm, setPreviousSearchTerm] = useState('');
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [copyStatus, setCopyStatus] = useState<'copy' | 'copied'>('copy'); // For clipboard copy animation
  
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Calculate time remaining in seconds
  const calculateTimeRemaining = (expiresAt: string) => {
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    return Math.max(0, Math.floor((expiryDate.getTime() - now.getTime()) / 1000));
  };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
const formatEmailAddress = (emailAddress: string | undefined): { name: string, email: string } => {
  if (!emailAddress) {
    return { name: 'Unknown Sender', email: 'unknown@example.com' };
  }

  let formatted = emailAddress.trim();

  // Handle quoted names (both regular and smart quotes)
  // Match pattern: "Name" <email@domain.com> or 'Name' <email@domain.com>
  const quotedPattern = /^["']?(.*?)["']?\s*<([^>]+)>$/;
  const match = formatted.match(quotedPattern);
  
  if (match) {
    const name = match[1].trim();
    const email = match[2].trim();
    
    // If name is empty or just whitespace, use email as name
    if (!name) {
      return { name: email, email };
    }
    
    return { name, email };
  }

  // Handle unquoted email addresses
  if (formatted.includes('@')) {
    // Check if it looks like a simple email address
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailPattern.test(formatted)) {
      return { name: formatted, email: formatted };
    }
  }
  // Just a name without email
  return { name: formatted, email: 'unknown@example.com' };
};
  // Initialize WebSocket connection - only when userId is available
  const { socket, connected } = useWebSocket(userId);
  
  // Function to render email preview content (handles both plain text and HTML)
  const renderEmailPreview = (content: string) => {
    // Check if content contains HTML tags
    if (/<[a-z][\s\S]*>/i.test(content)) {
      // For HTML content, sanitize and extract text
      const cleanHtml = DOMPurify.sanitize(content, { ALLOWED_TAGS: [] });
      return cleanHtml.substring(0, 100) + (cleanHtml.length > 100 ? '...' : ''); // Shorter for mobile
    }
    // For plain text content
    return content.substring(0, 100) + (content.length > 100 ? '...' : ''); // Shorter for mobile
  };
  
  // Function to render HTML content safely
  const renderHtmlContent = (htmlContent: string) => {
    // Sanitize the HTML to prevent XSS attacks
    const cleanHtml = DOMPurify.sanitize(htmlContent);
    
    // Use html-react-parser to safely render HTML
    return (
      <div className="max-w-full overflow-auto">
        {parse(cleanHtml)}
      </div>
    );
  };

  
  // Helper function to format dates as relative time
  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  // Debugging: Log connection status
  useEffect(() => {
    console.log('WebSocket connection status:', { connected, userId, socket: !!socket });
    
    // Additional debugging for connection issues
    if (userId && !socket) {
      console.warn('WebSocket not initialized despite having userId');
    }
    
    if (userId && socket && !connected) {
      console.warn('WebSocket initialized but not connected');
    }
    
    // If we have a userId but no socket after a delay, try to trigger a re-render
    if (userId && !socket) {
      const timer = setTimeout(() => {
        // This will force a re-render by updating a state variable
        // We'll use the existing state but with a slight modification
        if (userProfile) {
          setUserProfile({...userProfile}); // Shallow copy to trigger re-render
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [connected, userId, socket, userProfile]);

  // Fetch user profile and emails when component mounts
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    let lastError: any = null;
    let timeoutId: NodeJS.Timeout;
    
    const initialize = async () => {
      // Set a timeout to prevent indefinite loading
      timeoutId = setTimeout(() => {
        if (loading) {
          setError('Request timed out. Please check your connection and try again.');
          setLoading(false);
        }
      }, 15000); // 15 seconds timeout
      
      try {
        console.log('Initializing inbox...');
        
        // Get user profile
        const profileResponse = await apiClient.getProfile();
        console.log('Profile response:', profileResponse);
        
        if (profileResponse.user) {
          // Use _id instead of id for MongoDB documents
          console.log('Setting userId to:', profileResponse.user._id);
          setUserId(profileResponse.user._id);
          setUserProfile(profileResponse.user as User);
          console.log('User profile set:', profileResponse.user);
          
          // Set up magic link expiration timer if applicable
          if (profileResponse.user.magicLinkExpiresAt) {
            const remaining = calculateTimeRemaining(profileResponse.user.magicLinkExpiresAt);
            setTimeRemaining(remaining);
          }
          
          // Fetch initial emails only if we have a valid user
          const emailResponse = await apiClient.getEmails();
          console.log('Emails response:', emailResponse);
          
          if (emailResponse.emails) {
            setEmails(emailResponse.emails);
          }
        } else {
          console.warn('No user in profile response, redirecting to login');
          // Redirect to login if no user profile
          router.push('/login');
          setLoading(false);
          return;
        }
      } catch (err: any) {
        console.error('Error initializing inbox:', err);
        lastError = err;
        retryCount++;
        
        // Check if it's an authentication error
        if (err.message && (err.message.includes('Unauthorized') || err.message.includes('401') || err.message.includes('No token'))) {
          console.log('Authentication error, redirecting to login');
          router.push('/login');
          // Set loading to false immediately for auth errors
          setLoading(false);
          return;
        } else if (retryCount < maxRetries) {
          // Retry with exponential backoff
          console.log(`Retry attempt ${retryCount}/${maxRetries}`);
          setTimeout(initialize, 1000 * Math.pow(2, retryCount)); // 2^retryCount seconds
          return; // Exit early to prevent setting loading to false
        } else {
          setError('Failed to initialize inbox after multiple attempts');
        }
      } finally {
        // Clear the timeout
        clearTimeout(timeoutId);
      }
      
      // Set loading to false when initialization is complete (success or final failure)
      setLoading(false);
    };

    initialize();
    
    // Cleanup function to prevent state updates on unmounted component
    return () => {
      retryCount = maxRetries; // Prevent further retries
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // Set up interval to update time remaining for magic link
  useEffect(() => {
    if (userProfile?.magicLinkExpiresAt) {
      // Calculate initial time remaining
      const remaining = calculateTimeRemaining(userProfile.magicLinkExpiresAt);
      setTimeRemaining(remaining);
      
      // Set up interval to update every second
      intervalRef.current = setInterval(() => {
        const remaining = calculateTimeRemaining(userProfile.magicLinkExpiresAt!);
        setTimeRemaining(remaining);
        
        // If time is up, stop the interval
        if (remaining <= 0 && intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }, 1000);
    }

    // Clean up interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [userProfile?.magicLinkExpiresAt]);

  // Set up WebSocket listeners
  useEffect(() => {
    if (!socket) return;

    // Listen for new emails
    socket.on('newEmail', (newEmail: Email) => {
      console.log('New email received via WebSocket:', newEmail);
      
      // Add to emails list at the beginning (most recent first)
      setEmails(prevEmails => [newEmail, ...prevEmails]);
    });

    // Clean up listener
    return () => {
      socket.off('newEmail');
    };
  }, [socket, selectedEmail]);
  const handleLogout = () => {
    apiClient.logout().then(() => {
      router.push('/login');
    });
  };

  // State to track the currently selected email in the list for animation purposes
  const [selectingEmailId, setSelectingEmailId] = useState<string | null>(null);

  const handleEmailSelect = async (email: Email) => {
    try {
      // Set the email being selected for animation
      setSelectingEmailId(email._id);
      
      // Debug the email data
      console.log('Selected email data:', email);
      console.log('fromAddress:', email.fromAddress);
      console.log('Formatted fromAddress:', formatEmailAddress(email.fromAddress));
      console.log('toAddress:', email.toAddress);
      console.log('Formatted toAddress:', formatEmailAddress(email.toAddress));
      
      // Check if we're switching between emails
      const isSwitching = selectedEmail !== null;
      
      // Set navigation direction to 'forward' for right to left animation
      setNavigationDirection('forward');
      
      // Add a small delay to allow the selection animation to play
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // First, fetch the new email data from the backend
      const response = await apiClient.getEmailById(email._id);
      
      // Debug the response data
      console.log('Email response data:', response);
      if (response.email) {
        console.log('Response email fromAddress:', response.email.fromAddress);
        console.log('Formatted response email fromAddress:', formatEmailAddress(response.email.fromAddress));
        console.log('Response email toAddress:', response.email.toAddress);
        console.log('Formatted response email toAddress:', formatEmailAddress(response.email.toAddress));
      }
      
      if (isSwitching) {
        // For email switching, load content first then animate
        if (response.email) {
          // Load the new email content immediately
          setSelectedEmail(response.email ?? null);
          
          // Update the email in the list to mark it as read
          setEmails(emails.map(e => 
            e._id === email._id ? { ...e, isRead: true } : e
          ));
          
          // Now trigger the switching animation
          setIsEmailSwitching(true);
          
          // End the switching animation after a delay
          setTimeout(() => {
            setIsEmailSwitching(false);
          }, 300);
        }
      } else {
        // For opening a new email, load content first then animate
        if (response.email) {
          // Load the new email content immediately
          setSelectedEmail(response.email ?? null);
          
          // Update the email in the list to mark it as read
          setEmails(emails.map(e => 
            e._id === email._id ? { ...e, isRead: true } : e
          ));
          
          // Now trigger the opening animation
          setIsEmailOpening(true);
          setIsEmailLoading(false);
          
          // End the opening animation after a delay
          setTimeout(() => {
            setIsEmailOpening(false);
          }, 300);
        }
      }
      
      // Clear the selecting state after a delay
      setTimeout(() => {
        setSelectingEmailId(null);
      }, 300);
    } catch (err) {
      console.error('Error fetching email:', err);
      
      // Clear the selecting state on error
      setSelectingEmailId(null);
      
      // Handle error for both switching and opening
      const isSwitching = selectedEmail !== null;
      
      if (isSwitching) {
        // Load the email content immediately (fallback)
        setSelectedEmail(email);
        
        // Update the email in the list to mark it as read
        setEmails(emails.map(e => 
          e._id === email._id ? { ...e, isRead: true } : e
        ));
        
        // Now trigger the switching animation
        setIsEmailSwitching(true);
        
        // End the switching animation after a delay
        setTimeout(() => {
          setIsEmailSwitching(false);
        }, 300);
      } else {
        // Load the email content immediately (fallback)
        setSelectedEmail(email);
        setIsEmailLoading(false);
        
        // Update the email in the list to mark it as read
        setEmails(emails.map(e => 
          e._id === email._id ? { ...e, isRead: true } : e
        ));
        
        // Now trigger the opening animation
        setIsEmailOpening(true);
        
        // End the opening animation after a delay
        setTimeout(() => {
          setIsEmailOpening(false);
        }, 300);
      }
    }
  };

  const handleBackToInbox = () => {
    // Start closing animation
    setIsEmailClosing(true);
    
    // Wait for animation to complete before hiding the email
    setTimeout(() => {
      setSelectedEmail(null);
      setIsEmailClosing(false);
    }, 300); // Match the duration of the CSS transition
  };
  const toggleMobileMenu = () => {
    if (!showMobileMenu) {
      // Opening menu
      setIsMobileMenuAnimating(true);
      setShowMobileMenu(true);
    } else {
      // Closing menu
      setIsMobileMenuAnimating(true);
      setTimeout(() => {
        setShowMobileMenu(false);
        setIsMobileMenuAnimating(false);
      }, 300); // Match the duration of the CSS transition
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    
    // Trigger search animation when search term changes
    if (newSearchTerm !== previousSearchTerm) {
      setIsSearching(true);
      setTimeout(() => {
        setIsSearching(false);
      }, 200); // Reduced duration for smoother animation
      setPreviousSearchTerm(newSearchTerm);
    }
    
    setSearchTerm(newSearchTerm);
  };

  // Filter emails based on search term
  const filteredEmails = emails.filter(email => {
    const searchLower = searchTerm.toLowerCase();
    return (
      email.subject.toLowerCase().includes(searchLower) ||
      email.body.toLowerCase().includes(searchLower) ||
      (email.fromAddress && email.fromAddress.toLowerCase().includes(searchLower)) ||
      (email.toAddress && email.toAddress.toLowerCase().includes(searchLower))
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center origin-center" style={{ transformOrigin: 'center' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-foreground mx-auto mb-4"></div>
          <div className="text-foreground animate-pulse">Loading your inbox...</div>
          <div className="text-foreground/70 text-sm mt-2">Please wait while we fetch your emails</div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center origin-center" style={{ transformOrigin: 'center' }}>
        <div className="max-w-md w-full bg-card rounded-xl shadow-lg p-8 space-y-6 border border-border animate-fadeInZoom">
          <div className="text-center">
            <div className="mx-auto bg-red-100 text-red-600 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4 animate-bounceIn">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Unable to Load Inbox</h1>
            <p className="text-foreground/80 mb-6">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push('/login')}
                className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-accent transition-all duration-200 text-foreground"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-gradient-to-br from-background to-muted flex flex-col md:flex-row animate-fadeIn overflow-hidden" style={{ maxWidth: '100vw', maxHeight: '100vh' }}>
      {/* Mobile header when email is selected */}
      {selectedEmail && (
        <div className="md:hidden bg-card border-b border-foreground/10 p-4 flex items-center">
          <button 
            onClick={handleBackToInbox}
            className="flex items-center text-foreground hover:text-primary mr-4 transition-colors duration-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back</span>
          </button>
          <h1 className="text-lg font-bold text-foreground truncate">Email</h1>
        </div>
      )}
      
      {/* Mobile menu button - only shown when not viewing an email */}
      {!selectedEmail && (
        <div className="md:hidden bg-card border-b border-foreground/10 p-4 flex items-center justify-between">
          <button 
            onClick={toggleMobileMenu}
            className="flex items-center text-foreground hover:text-primary transition-colors duration-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-foreground">MailBox</h1>
        </div>
      )}
      
      {/* Side Header - Hidden on mobile when email is selected */}
      <aside className={`bg-card border-r border-foreground/20 flex flex-col transition-all duration-300 ease-in-out shadow-2xl rounded-r-2xl transform backdrop-blur-sm
        ${selectedEmail 
          ? 'hidden md:flex md:w-64' 
          : showMobileMenu 
            ? 'w-64 fixed inset-y-0 z-30 md:relative translate-x-0 animate-fadeInSlideRight' 
            : 'hidden md:flex md:w-64 -translate-x-full md:translate-x-0'
        }`}>
        <div className="p-5 border-b border-foreground/10">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Mail<span className="text-primary">Box</span>
            </h1>
            <button 
              onClick={toggleMobileMenu}
              className="md:hidden text-foreground hover:text-primary transition-colors duration-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="mb-6 animate-fadeInSlideRight">
            <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              Inbox
            </h2>
            <div className="bg-primary/10 rounded-xl p-3 transition-all duration-300 hover:scale-[1.02] shadow-sm hover:shadow-md">
              <p className="text-foreground font-medium">
                {emails.filter(e => !e.isRead).length} unread messages
              </p>
              {connected && (
                <div className="flex items-center mt-1">
                  <span className="text-green-500 text-xs mr-1 animate-pulse">●</span>
                  <span className="text-green-500 text-xs font-medium">Live</span>
                </div>
              )}
            </div>
            
            {/* Magic Link Expiration Notice */}
            {timeRemaining !== null && timeRemaining > 0 && (
              <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded animate-fadeIn">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Magic Link Expiring Soon</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        Your session will expire in <span className="font-bold">{formatTime(timeRemaining)}</span>.
                      </p>
                      <p className="mt-1">
                        Sign in and reset your password, then change email fast before magic link expires!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 border-t border-foreground/10">
          <div className="flex items-center justify-between mb-4 animate-fadeInSlideRight">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-foreground flex items-center justify-center transition-transform duration-300 hover:scale-110 shadow-lg animate-pulseGlow">
                <span className="text-lg font-bold text-background">
                  {userProfile?.email?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="ml-3">
                <div className="text-sm font-semibold text-foreground">{userProfile?.username || 'User'}</div>
                <div className="text-xs text-foreground/70 truncate flex items-center group">
                  <span>{userProfile?.email || ''}</span>
                  {userProfile?.email && (
                    <CopyButton
                      content={userProfile.email}
                      size="sm"
                      variant="ghost"
                      className="ml-2 opacity-100 group-hover:opacity-100 transition-opacity"
                      onCopyChange={(isCopied: boolean) => {
                        if (isCopied) {
                          setCopyStatus('copied');
                          setTimeout(() => setCopyStatus('copy'), 2000);
                        }
                      }}
                    />
                  )}
                </div>
                
                {/* Magic Link Expiration Timer - Small version for user card */}
                {timeRemaining !== null && timeRemaining > 0 && (
                  <div className="text-xs text-yellow-600 font-medium mt-1">
                    Expires in: {formatTime(timeRemaining)}
                  </div>
                )}
              </div>
            </div>
            
            <button 
              onClick={handleLogout}
              className="text-sm text-foreground hover:text-primary transition-colors duration-300 flex items-center group bg-foreground/10 hover:bg-foreground/20 p-2 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:rotate-6 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile menu */}
      {showMobileMenu && (
        <div 
          className={`md:hidden fixed inset-0 bg-black/50 z-20 transition-opacity duration-300 ${isMobileMenuAnimating ? 'opacity-100' : 'opacity-0'} animate-fadeIn`}
          onClick={toggleMobileMenu}
        ></div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Email List Section - Always visible on desktop, hidden on mobile when detail is shown */}
        <div className={`${selectedEmail ? 'hidden md:flex md:w-2/5' : 'w-full'} border-r border-foreground/20 flex flex-col transition-all duration-300 ease-in-out backdrop-blur-sm overflow-hidden`}>
          <div className="flex-1 flex flex-col h-full">
            <div className="flex-shrink-0 mb-6 p-4 border-b border-foreground/10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Inbox</h2>
                  <p className="text-foreground mt-1">
                    {emails.filter(e => !e.isRead).length} unread messages
                    {connected && (
                      <span className="text-green-500 text-sm ml-2">• Live</span>
                    )}
                  </p>
                  
                  {/* Magic Link Expiration Timer - Top of email list */}
                  {timeRemaining !== null && timeRemaining > 0 && (
                    <div className="mt-2 bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1.5 rounded-lg inline-flex items-center animate-pulse">
                      <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Expires in: {formatTime(timeRemaining)}
                    </div>
                  )}
                </div>
              </div>
              {/* Search Bar */}
              <div className="mt-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search emails..."
                    className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-foreground transition-all duration-300 ease-in-out shadow-sm hover:shadow-md"
                    value={searchTerm}
                    onChange={handleSearchChange}
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
            <div className="flex-1 overflow-hidden">
              <div className={`transition-all duration-200 ease-in-out ${isSearching ? 'opacity-80 scale-[0.98]' : 'opacity-100 scale-100'}`}>
                <div className="flex flex-col h-full">
                  <div className="flex-1 overflow-hidden rounded-bl-xl h-full">
                    {filteredEmails.length === 0 && !isSearching ? (
                      <div className="p-8 text-center text-foreground animate-fadeInZoom">
                        <div className="flex flex-col items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-foreground/30 mb-4 animate-bounceIn" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <p className="text-xl font-medium text-foreground/70">No emails found</p>
                          <p className="text-foreground/50 mt-2">Try adjusting your search terms</p>
                        </div>
                      </div>
                    ) : (
                      <ul className="divide-y divide-foreground/10 px-2 h-full">
                        {filteredEmails.map((email, index) => (
                          <li 
                            key={email._id} 
                            className={`p-4 hover:bg-muted/50 cursor-pointer transition-all duration-200 ease-out group rounded-xl shadow-sm border border-foreground/20
                              ${!email.isRead 
                                ? 'bg-foreground/5 border-l-4 border-foreground' 
                                : 'hover:border-l-4 hover:border-foreground/30'
                              }
                              ${isSearching ? 'opacity-90 translate-y-1 scale-[0.995]' : 'opacity-100 translate-y-0 scale-100'}
                              ${selectingEmailId === email._id ? 'scale-[0.98] bg-primary/20 transition-all duration-200' : ''}
                              ${selectedEmail?._id === email._id ? 'ring-2 ring-primary/50 bg-primary/10' : ''}
                              hover:scale-[1.01] active:scale-[0.99]`}
                            onClick={() => handleEmailSelect(email)}
                            style={{ 
                              transitionProperty: 'opacity, transform, scale, background-color',
                              transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                              transitionDuration: '0.2s',
                              animationDelay: `${index * 20}ms`
                            }}
                          >
                            <div className="flex items-start">
                              {/* Avatar placeholder - visible on all screens now */}
                              <div className="flex-shrink-0 mr-3">
                                <div className="h-10 w-10 rounded-full bg-foreground/10 flex items-center justify-center">
                                  <span className="text-sm font-medium text-foreground">
                                    {formatEmailAddress(email.fromAddress).name.charAt(0) || 'U'}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <p className={`text-sm truncate ${email.isRead ? 'text-foreground/70' : 'text-foreground font-bold'}`}>
                                      {formatEmailAddress(email.fromAddress).name} {formatEmailAddress(email.fromAddress).email} 
                                    </p>
                                    {!email.isRead && (
                                      <span className="ml-2 h-2 w-2 rounded-full bg-foreground"></span>
                                    )}
                                  </div>
                                  <div className="flex items-center">
                                    <p className="text-xs text-foreground/50 whitespace-nowrap ml-2">
                                      {formatRelativeDate(email.createdAt)}
                                    </p>
                                  </div>
                                </div>
                                
                                <p className={`text-sm font-medium truncate mt-1 ${email.isRead ? 'text-foreground' : 'text-foreground font-bold'}`}>
                                  {email.subject || '(No Subject)'}
                                </p>
                                
                                <div className="flex items-center mt-1">
                                  <p className="text-xs text-foreground/60 truncate">
                                    {renderEmailPreview(email.body)}
                                  </p>
                                  {/* Show indicator if email contains HTML */}
                                  {/<[a-z][\s\S]*>/i.test(email.body) && (
                                    <span className="ml-2 text-xs bg-foreground/10 text-foreground/70 px-1.5 py-0.5 rounded whitespace-nowrap">
                                      HTML
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              {/* Star icon for starred emails */}
                              {email.isStarred && (
                                <div className="ml-2 flex items-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Email Detail Section - Side by side on desktop, full screen on mobile when selected */}
        {(selectedEmail || isEmailLoading) && (
          <div className={`w-full md:w-3/5 flex flex-col h-full transition-all duration-300 ease-in-out overflow-hidden shadow-2xl backdrop-blur-sm
            ${isEmailOpening ? 'animate-slideInFromRight' : ''}
            ${isEmailClosing ? 'animate-slideOutToLeft' : ''}
            ${isEmailSwitching ? 'animate-slideOutToLeft' : ''}`} 
            style={{ maxWidth: '100vw', maxHeight: '100vh' }}>
            {isEmailLoading && !selectedEmail ? (
              <div className="flex flex-col h-full w-full bg-card border-l border-foreground/10 items-center justify-center animate-fadeIn">
                <div className="flex flex-col items-center">
                  <div className="animate-spinSmooth rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
                  <p className="text-foreground animate-fadeIn delay-200">Loading email...</p>
                </div>
              </div>
            ) : (
              <div className={`h-full w-full overflow-hidden ${isEmailSwitching ? 'animate-slideInFromRight' : ''}`}>
                <div>
                  {/* Email Header - Increased size */}
                  <div className="border-b border-foreground/10 p-4" style={{ flexShrink: 0 }}>
                    <div className="flex justify-between items-center">
                      <button 
                        onClick={handleBackToInbox}
                        className="flex items-center text-foreground hover:text-primary mb-3 transition-colors duration-200 animate-fadeInSlideRight text-sm"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Inbox
                      </button>
                      
                      {/* Close Button for Desktop */}
                      <button 
                        onClick={handleBackToInbox}
                        className="hidden md:flex items-center justify-center h-8 w-8 rounded-full hover:bg-foreground/10 transition-colors duration-200"
                        aria-label="Close email"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* Move date to header section - Increased size */}
                    <div className="flex justify-between items-center mb-3">
                      <h1 className="text-xl font-bold text-foreground overflow-hidden text-ellipsis whitespace-nowrap">{selectedEmail?.subject || '(No Subject)'}</h1>
                      <div className="text-sm text-foreground/70 whitespace-nowrap ml-2 overflow-hidden text-ellipsis" style={{ maxWidth: '150px', flexShrink: 0 }}>
                        {selectedEmail && new Date(selectedEmail.createdAt).toLocaleString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    
                    <div className="flex items-start animate-fadeInSlideRight delay-150">
                      <div className="h-10 w-10 rounded-full bg-foreground/10 flex items-center justify-center mr-3 flex-shrink-0 animate-bounceIn">
                        <span className="text-base font-bold text-foreground">
                          {formatEmailAddress(selectedEmail?.fromAddress).name.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-foreground truncate text-base">{formatEmailAddress(selectedEmail?.fromAddress).name}</div>
                        <div className="text-sm text-foreground/70 truncate">from {formatEmailAddress(selectedEmail?.fromAddress).email} to {formatEmailAddress(selectedEmail?.toAddress).email}</div>
                        
                        {/* Magic Link Expiration Timer - In email view */}
                        {timeRemaining !== null && timeRemaining > 0 && (
                          <div className="text-xs text-yellow-600 font-medium mt-1 flex items-center">
                            <svg className="h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Session expires in: {formatTime(timeRemaining)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Email Body with scrollbars */}
                  <div className="flex-1 overflow-auto p-4 animate-fadeIn delay-200 scrollbar scrollbar-thin scrollbar-thumb-rounded-full scrollbar-track-transparent scrollbar-thumb-foreground/30" style={{ maxWidth: '100%', boxSizing: 'border-box' }}>
                    {selectedEmail?.body ? (
                      // Check if body contains HTML tags
                      /<[a-z][\s\S]*>/i.test(selectedEmail.body) ? (
                        // HTML email content in a container with max width
                        <div className="max-w-3xl mx-auto">
                          {renderHtmlContent(selectedEmail.body)}
                        </div>
                      ) : (
                        // Plain text email with minimal spacing
                        <div className="w-fit">
                          <pre className="whitespace-pre-wrap font-sans text-foreground break-words text-sm p-0 m-0" style={{ maxWidth: '100%', wordWrap: 'break-word' }}>
                            {selectedEmail.body}
                          </pre>
                        </div>
                      )
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-foreground p-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-foreground/30 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <p className="text-base font-medium text-foreground/70">No content available</p>
                        <p className="text-foreground/50 mt-1 text-xs">This email appears to be empty</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}