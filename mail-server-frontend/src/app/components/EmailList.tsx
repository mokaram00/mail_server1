'use client';

import { useState } from 'react';

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

interface EmailListProps {
  emails: Email[];
  onSelectEmail: (email: Email) => void;
  searchTerm: string;
}

export default function EmailList({ emails, onSelectEmail, searchTerm }: EmailListProps) {
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

  return (
    <div className="flex flex-col h-full">
      {/* Email List */}
      <div className="flex-1 overflow-y-auto">
        {filteredEmails.length === 0 ? (
          <div className="p-8 text-center text-foreground">
            <p>No emails found.</p>
          </div>
        ) : (
          <ul className="divide-y divide-foreground">
            {filteredEmails.map((email, index) => (
              <li 
                key={email._id} 
                className={`p-4 hover:bg-muted cursor-pointer transition-all duration-200 ${
                  !email.isRead ? 'bg-foreground/5 border-l-4 border-foreground' : ''
                }`}
                onClick={() => onSelectEmail(email)}
              >
                <div className="flex items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium truncate ${email.isRead ? 'text-foreground' : 'text-foreground font-bold'}`}>
                        {email.fromAddress || 'Unknown Sender'}
                      </p>
                      <p className="text-sm text-foreground whitespace-nowrap ml-2">
                        {new Date(email.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <p className={`text-sm font-medium truncate mt-1 ${email.isRead ? 'text-foreground' : 'text-foreground font-bold'}`}>
                      {email.subject}
                    </p>
                    <p className="text-sm text-foreground truncate mt-1">
                      {email.body.substring(0, 120)}...
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}