import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { translations, type Language, type TranslationKeys } from './translations';
import { getSettings, saveSettings } from '../db/db';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: TranslationKeys;
    isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>('ar'); // Default to Arabic
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        loadLanguage();
    }, []);

    useEffect(() => {
        // Apply RTL/LTR direction
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = language;
    }, [language]);

    async function loadLanguage() {
        try {
            const settings = await getSettings();
            if (settings?.language) {
                setLanguageState(settings.language as Language);
            }
        } catch (error) {
            console.error('Failed to load language settings:', error);
        } finally {
            setIsLoaded(true);
        }
    }

    async function setLanguage(lang: Language) {
        setLanguageState(lang);
        await saveSettings({ language: lang });
    }

    const value: LanguageContextType = {
        language,
        setLanguage,
        t: translations[language],
        isRTL: language === 'ar',
    };

    // Show nothing while loading to prevent flash
    if (!isLoaded) {
        return null;
    }

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage(): LanguageContextType {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
