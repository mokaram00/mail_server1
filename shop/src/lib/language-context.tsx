'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ar' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  dir: 'rtl' | 'ltr';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Helper function to get saved language from localStorage
const getSavedLanguage = (): Language => {
  if (typeof window !== 'undefined') {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'ar' || savedLanguage === 'en')) {
      return savedLanguage;
    }
  }
  return 'ar'; // Default language
};

// Helper function to save language to localStorage
const saveLanguage = (language: Language) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('language', language);
    document.cookie = `language=${language}; path=/; max-age=31536000`; // 1 year
  }
};

export function LanguageProvider({ children, initialLanguage, initialMessages }: { children: React.ReactNode; initialLanguage: Language; initialMessages: any }) {
  const [language, setLanguageState] = useState<Language>(initialLanguage);

  const [messages, setMessages] = useState<any>(initialMessages);

  // Load translations dynamically
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const response = await fetch(`/translations/${language}.json`);
        const data = await response.json();
        setMessages(data);
      } catch (error) {
        console.error('Failed to load translations:', error);
        // Fallback to empty object
        setMessages({});
      }
    };

    loadMessages();
  }, [language]);

  // Save language when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      saveLanguage(language);
      // Update DOM attributes
      document.documentElement.lang = language;
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    }
  }, [language]);

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = messages;

    for (const k of keys) {
      value = value?.[k];
    }

    if (typeof value === 'string' && params) {
      // Simple parameter replacement
      let result = value;
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        result = result.replace(new RegExp(`{${paramKey}}`, 'g'), String(paramValue));
      });
      return result;
    }

    return value || key;
  };

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      <div dir={dir} suppressHydrationWarning>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
