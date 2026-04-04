import { createContext, useContext, useEffect, useState } from 'react'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

const AuthContext = createContext({})
export function useAuth() { return useContext(AuthContext) }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function signup(email, password, displayName) {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(result.user, { displayName })
    const isAdmin = email === import.meta.env.VITE_ADMIN_EMAIL
    const profileData = {
      uid: result.user.uid,
      email,
      displayName,
      isAdmin,
      isSupplier: false,
      createdAt: new Date().toISOString()
    }
    await setDoc(doc(db, 'users', result.user.uid), profileData)
    return result
  }

  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  async function logout() {
    setUserProfile(null)
    return signOut(auth)
  }

  async function fetchUserProfile(uid) {
    const snap = await getDoc(doc(db, 'users', uid))
    if (snap.exists()) {
      setUserProfile(snap.data())
      return snap.data()
    }
    return null
  }

  async function refreshProfile() {
    if (user) return fetchUserProfile(user.uid)
  }

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) await fetchUserProfile(u.uid)
      else setUserProfile(null)
      setLoading(false)
    })
  }, [])

  const isAdmin = userProfile?.isAdmin || user?.email === import.meta.env.VITE_ADMIN_EMAIL
  const isSupplier = userProfile?.isSupplier || false

  const value = { user, userProfile, loading, isAdmin, isSupplier, signup, login, logout, fetchUserProfile, refreshProfile }
  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
}