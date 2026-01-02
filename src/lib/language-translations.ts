/**
 * Language name translations for UI display
 * Used in both admin job wizard and candidate application forms
 */
export const LANGUAGE_TRANSLATIONS: Record<string, { en: string; ar: string }> = {
    'English': { en: 'English', ar: 'الإنجليزية' },
    'Arabic': { en: 'Arabic', ar: 'العربية' },
    'Spanish': { en: 'Spanish', ar: 'الإسبانية' },
    'French': { en: 'French', ar: 'الفرنسية' },
    'German': { en: 'German', ar: 'الألمانية' },
    'Chinese': { en: 'Chinese', ar: 'الصينية' },
    'Japanese': { en: 'Japanese', ar: 'اليابانية' },
    'Turkish': { en: 'Turkish', ar: 'التركية' },
    'Russian': { en: 'Russian', ar: 'الروسية' },
    'Portuguese': { en: 'Portuguese', ar: 'البرتغالية' },
}

/**
 * Get localized language name based on locale
 */
export function getLocalizedLanguageName(language: string, locale: string = 'en'): string {
    if (LANGUAGE_TRANSLATIONS[language]) {
        return locale === 'ar' ? LANGUAGE_TRANSLATIONS[language].ar : LANGUAGE_TRANSLATIONS[language].en
    }
    return language
}










