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

  const t = (key, params = {}) => {
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

    let result = value || key;
    if (typeof result === 'string' && params) {
      for (const [k, v] of Object.entries(params)) {
        result = result.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
      }
    }
    return result;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
