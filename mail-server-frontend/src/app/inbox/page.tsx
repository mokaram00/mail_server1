'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '../components/ThemeToggle';

export default function Inbox() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [emails, setEmails] = useState([
    {
      id: 1,
      sender: 'John Doe',
      subject: 'Meeting Tomorrow',
      preview: 'Hi there, just confirming our meeting scheduled for tomorrow at 10am...',
      time: '9:30 AM',
      read: false,
      starred: false,
    },
    {
      id: 2,
      sender: 'Jane Smith',
      subject: 'Project Update',
      preview: 'The project is progressing well. Here\'s the latest update on our milestones...',
      time: 'Yesterday',
      read: true,
      starred: true,
    },
    {
      id: 3,
      sender: 'Tech Newsletter',
      subject: 'Weekly Digest: Latest Tech News',
      preview: 'This week\'s top stories include the latest AI developments and cybersecurity trends...',
      time: 'Dec 15',
      read: false,
      starred: false,
    },
    {
      id: 4,
      sender: 'Michael Johnson',
      subject: 'Vacation Request',
      preview: 'I wanted to submit my vacation request for next month. Please let me know...',
      time: 'Dec 14',
      read: true,
      starred: false,
    },
    {
      id: 5,
      sender: 'Sarah Williams',
      subject: 'Welcome to the Team!',
      preview: 'Welcome aboard! We\'re excited to have you join our team. Here\'s what you need to know...',
      time: 'Dec 12',
      read: true,
      starred: true,
    },
  ]);
  
  const router = useRouter();

  const handleLogout = () => {
    // In a real application, you would clear the user's session here
    router.push('/login');
  };

  const toggleStar = (id: number) => {
    setEmails(emails.map(email => 
      email.id === id ? { ...email, starred: !email.starred } : email
    ));
  };

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
                { name: 'Inbox', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', count: 5, active: true },
                { name: 'Drafts', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', count: 2 },
                { name: 'Saved', icon: 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z', count: 8 },
                { name: 'Snoozed', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', count: 3 },
                { name: 'Sent', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z', count: 24 },
                { name: 'Trash', icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16', count: 7 }
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
                <p className="text-foreground mt-1">5 unread messages</p>
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
                  key={email.id} 
                  className={`p-4 hover:bg-muted cursor-pointer transition-all duration-300 ${
                    !email.read ? 'bg-foreground/5 border-l-4 border-foreground' : ''
                  } animate-fadeInSlideRight`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="h-4 w-4 text-foreground focus:ring-foreground border-foreground rounded"
                    />
                    <button 
                      onClick={() => toggleStar(email.id)}
                      className="ml-4 text-foreground hover:text-foreground transition-colors duration-300"
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-5 w-5 ${email.starred ? 'text-foreground fill-current' : ''}`} 
                        fill={email.starred ? "currentColor" : "none"} 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </button>
                    <div className="ml-4 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium truncate ${email.read ? 'text-foreground' : 'text-foreground font-bold'}`}>
                          {email.sender}
                        </p>
                        <div className="flex items-center space-x-2">
                          <p className="text-sm text-foreground">
                            {email.time}
                          </p>
                          <button className="text-foreground hover:text-foreground transition-colors duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <p className={`text-sm truncate ${email.read ? 'text-foreground' : 'text-foreground font-medium'}`}>
                        {email.subject}
                      </p>
                      <p className="text-sm text-foreground truncate">
                        {email.preview}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </main>
      </div>
    </div>
  );
}