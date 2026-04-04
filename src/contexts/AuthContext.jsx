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

  async function signup(email, password, role, displayName, country) {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(result.user, { displayName })
    const isAdmin = email === import.meta.env.VITE_ADMIN_EMAIL
    const profileData = { uid: result.user.uid, email, displayName, role: isAdmin ? 'admin' : role, country: country || '', createdAt: new Date().toISOString() }
    await setDoc(doc(db, 'users', result.user.uid), profileData)
    return result
  }

  async function login(email, password) { return signInWithEmailAndPassword(auth, email, password) }
  async function logout() { setUserProfile(null); return signOut(auth) }

  async function fetchUserProfile(uid) {
    const snap = await getDoc(doc(db, 'users', uid))
    if (snap.exists()) { setUserProfile(snap.data()); return snap.data() }
    return null
  }

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) await fetchUserProfile(u.uid)
      else setUserProfile(null)
      setLoading(false)
    })
  }, [])

  const isAdmin = userProfile?.role === 'admin' || user?.email === import.meta.env.VITE_ADMIN_EMAIL
  const value = { user, userProfile, loading, isAdmin, signup, login, logout, fetchUserProfile }

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
}