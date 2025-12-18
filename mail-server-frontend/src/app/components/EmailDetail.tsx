'use client';

import { useState } from 'react';
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

interface EmailDetailProps {
  email: Email;
  onBack: () => void;
}

export default function EmailDetail({ email, onBack }: EmailDetailProps) {
  // Function to render HTML content safely
  const renderHtmlContent = (htmlContent: string) => {
    // Sanitize the HTML to prevent XSS attacks
    const cleanHtml = DOMPurify.sanitize(htmlContent);
    
    // Use html-react-parser to safely render HTML
    return (
      <div className="prose prose-headings:text-foreground prose-p:text-foreground prose-a:text-blue-500 max-w-none">
        {parse(cleanHtml)}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-card border-l border-foreground">
      {/* Email Header */}
      <div className="border-b border-foreground p-4">
        <button 
          onClick={onBack}
          className="flex items-center text-foreground hover:text-muted mb-4 transition-colors duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Inbox
        </button>
        
        <h1 className="text-2xl font-bold text-foreground mb-2">{email.subject}</h1>
        
        <div className="flex items-center justify-between border-b border-foreground pb-4 mb-4">
          <div>
            <div className="font-medium text-foreground">{email.fromAddress || 'Unknown Sender'}</div>
            <div className="text-sm text-foreground">
              to {email.toAddress || 'me'} • {new Date(email.createdAt).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
      
      {/* Email Body with nice scrollbar */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-400">
        {email.body ? (
          // Check if body contains HTML tags
          /<[a-z][\s\S]*>/i.test(email.body) ? (
            renderHtmlContent(email.body)
          ) : (
            <pre className="whitespace-pre-wrap text-foreground">{email.body}</pre>
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-foreground/50 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="text-lg">No content available</p>
            <p className="text-foreground/70 mt-2">This email appears to be empty</p>
          </div>
        )}
      </div>
    </div>
  );
}