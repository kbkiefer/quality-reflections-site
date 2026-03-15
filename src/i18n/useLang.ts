import { useState, useEffect } from 'react';

/**
 * React hook for language reactivity.
 * Listens to the global 'langchange' CustomEvent dispatched by the
 * language switcher script. Returns the current language code.
 */
export function useLang(): 'en' | 'es' {
  const [lang, setLang] = useState<'en' | 'es'>(() => {
    if (typeof window !== 'undefined') {
      return (window as any).__lang === 'es' ? 'es' : 'en';
    }
    return 'en';
  });

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setLang(detail?.lang === 'es' ? 'es' : 'en');
    };
    window.addEventListener('langchange', handler);
    return () => window.removeEventListener('langchange', handler);
  }, []);

  return lang;
}
