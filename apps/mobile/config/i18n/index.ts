import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import es from '@/locales/es.json';

i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
  },
  lng: Localization.locale.split('-')[0],
  fallbackLng: 'es',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
