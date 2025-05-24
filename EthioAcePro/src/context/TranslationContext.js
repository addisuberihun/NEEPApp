import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translations
import en from '../../app/translations/en.json';
import am from '../../app/translations/am.json';

// Create the context
const TranslationContext = createContext();

// Available languages
const languages = {
  en: en,
  am: am
};

export const TranslationProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [translations, setTranslations] = useState(languages.en);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved language preference on app start
  useEffect(() => {
    const loadLanguagePreference = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('appLanguage');
        if (savedLanguage && languages[savedLanguage]) {
          setCurrentLanguage(savedLanguage);
          setTranslations(languages[savedLanguage]);
        }
      } catch (error) {
        console.error('Error loading language preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLanguagePreference();
  }, []);

  // Function to change language
  const changeLanguage = async (languageCode) => {
    if (languages[languageCode]) {
      try {
        setCurrentLanguage(languageCode);
        setTranslations(languages[languageCode]);
        await AsyncStorage.setItem('appLanguage', languageCode);
        return true;
      } catch (error) {
        console.error('Error saving language preference:', error);
        return false;
      }
    }
    return false;
  };

  // Translation function
  const t = (key) => {
    // Split the key by dots to access nested properties
    const keys = key.split('.');
    let value = translations;
    
    // Navigate through the nested properties
    for (const k of keys) {
      if (value && value[k]) {
        value = value[k];
      } else {
        // If translation not found, return the key
        return key;
      }
    }
    
    return value;
  };

  return (
    <TranslationContext.Provider 
      value={{ 
        currentLanguage, 
        changeLanguage, 
        t, 
        isLoading,
        availableLanguages: Object.keys(languages)
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
};

// Custom hook to use the translation context
export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};