import { I18n } from 'i18n-js';
import en from './en';
import am from './am';
import AsyncStorage from '@react-native-async-storage/async-storage';

const i18n = new I18n({ en, am });

// Default language
i18n.defaultLocale = 'en';
i18n.locale = 'en';
i18n.enableFallback = true;

export const loadLanguage = async () => {
    const lang = await AsyncStorage.getItem('appLanguage');
    i18n.locale = lang || 'en';
};

export default i18n;
