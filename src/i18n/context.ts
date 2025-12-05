import { createContext } from 'react';
import type { Language, TranslationKeys } from './translations';

export interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: TranslationKeys;
    isRTL: boolean;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
