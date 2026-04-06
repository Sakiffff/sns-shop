import { createContext, useContext, useState, useEffect } from 'react'

const CountryContext = createContext({})
export function useCountry() { return useContext(CountryContext) }

export function CountryProvider({ children }) {
  const [country, setCountry] = useState(
    () => localStorage.getItem('sns_country') || 'Worldwide'
  )

  useEffect(() => {
    // Auto-detect on first visit
    if (!localStorage.getItem('sns_country')) {
      fetch('https://ipapi.co/json/')
        .then(r => r.json())
        .then(d => {
          if (d.country_name) {
            setCountry(d.country_name)
            localStorage.setItem('sns_country', d.country_name)
          }
        })
        .catch(() => {})
    }
  }, [])

  function selectCountry(c) {
    setCountry(c)
    localStorage.setItem('sns_country', c)
  }

  return (
    <CountryContext.Provider value={{ country, selectCountry }}>
      {children}
    </CountryContext.Provider>
  )
}
