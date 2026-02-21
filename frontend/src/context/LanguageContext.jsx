import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { translations, getNested } from '../lib/translations'

const STORAGE_KEY = 'krishimitra_lang'
const VALID_LANGS = ['en', 'hi', 'mr']

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored && VALID_LANGS.includes(stored)) return stored
    } catch {}
    return 'en'
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, language)
    } catch {}
  }, [language])

  useEffect(() => {
    try {
      document.documentElement.lang = language
    } catch {}
  }, [language])

  const setLanguage = useCallback((lang) => {
    if (VALID_LANGS.includes(lang)) setLanguageState(lang)
  }, [])

  const t = useMemo(() => {
    return (key, vars) => {
      let value = getNested(translations[language], key)
      if (value == null) value = getNested(translations.en, key) ?? key
      if (vars && typeof value === 'string') {
        return value.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : `{${k}}`))
      }
      return value
    }
  }, [language])

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t]
  )

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider')
  return ctx
}
