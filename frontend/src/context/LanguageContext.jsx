import React, { createContext, useState, useEffect, useContext } from 'react';
import en from '../translations/en.json';
import hi from '../translations/hi.json';
import mr from '../translations/mr.json';

const translations = { en, hi, mr };

export const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('agrimitra_lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('agrimitra_lang', language);
    document.documentElement.lang = language;
  }, [language]);

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[language];
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) break;
    }
    
    if (value === undefined) {
      // Fallback to English
      value = translations['en'];
      for (const k of keys) {
        value = value?.[k];
        if (value === undefined) break;
      }
    }
    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
