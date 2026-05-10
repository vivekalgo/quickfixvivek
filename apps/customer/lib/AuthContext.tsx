'use client'
// AuthContext - wraps Firebase onAuthStateChanged into a React context
// Also syncs the user record to Supabase on first sign-in.
import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from 'react'
import {
    onAuthStateChanged,
    signOut as firebaseSignOut,
    updateProfile as firebaseUpdateProfile,
    User as FirebaseUser,
} from 'firebase/auth'
import { auth } from './firebase'
import { supabase } from './data'

interface AuthUser {
    uid: string
    phone: string | null
    displayName: string | null
    email: string | null
    role: string
}

interface AuthContextValue {
    user: AuthUser | null
    loading: boolean
    signOut: () => Promise<void>
    updateProfile: (updates: { name: string }) => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
    user: null,
    loading: true,
    signOut: async () => {},
    updateProfile: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!auth) {
            setLoading(false)
            return
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                // 1. Try to find user by exact Firebase UID
                let { data: existingUser } = await supabase.from('users').select('*').eq('id', firebaseUser.uid).single()
                
                // 2. If not found by ID, try finding by Phone (in case Firebase auth was reset)
                if (!existingUser && firebaseUser.phoneNumber) {
                    const { data: phoneUser } = await supabase.from('users').select('*').eq('phone', firebaseUser.phoneNumber).single()
                    if (phoneUser) existingUser = phoneUser
                }

                // 3. Map to the final UID we will use for DB queries
                const finalUid = existingUser ? existingUser.id : firebaseUser.uid

                const authUser: AuthUser = {
                    uid: finalUid,
                    phone: firebaseUser.phoneNumber,
                    displayName: existingUser ? existingUser.name : (firebaseUser.displayName || 'User'),
                    email: firebaseUser.email,
                    role: existingUser ? existingUser.role : 'customer',
                }
                setUser(authUser)

                // 4. Create row if brand new user
                if (!existingUser) {
                    await supabase.from('users').insert({
                        id: finalUid,
                        phone: firebaseUser.phoneNumber ?? '',
                        name: firebaseUser.displayName ?? 'User',
                        role: 'customer',
                    })
                }
            } else {
                setUser(null)
            }
            setLoading(false)
        })
        return unsubscribe
    }, [])

    const signOut = async () => {
        if (!auth) return
        await firebaseSignOut(auth)
    }

    const updateProfile = async (updates: { name: string }) => {
        if (!user) return
        
        // 1. Try to update Firebase Auth profile
        if (auth?.currentUser) {
            try {
                await firebaseUpdateProfile(auth.currentUser, { displayName: updates.name })
            } catch (e) {
                console.warn('Firebase profile update failed:', e)
            }
        }

        // 2. Update Supabase
        try {
            let { error, data } = await supabase.from('users').update({ name: updates.name }).eq('id', user.uid).select()
            
            if (error) throw new Error(error.message)
            
            if (!data || data.length === 0) {
                // If update failed, the user's ID might have changed (stale React state or Firebase reset)
                // Let's try to update by phone number before falling back to upsert
                if (user.phone) {
                    const { error: phoneErr, data: phoneData } = await supabase.from('users')
                        .update({ name: updates.name })
                        .eq('phone', user.phone)
                        .select()
                        
                    if (!phoneErr && phoneData && phoneData.length > 0) {
                        // Successfully updated existing row! Update our local state to match the DB ID
                        setUser(prev => prev ? { ...prev, uid: phoneData[0].id, displayName: updates.name } : null)
                        return
                    }
                }

                // If still not found, then it's truly a new row. Upsert it.
                const { error: upsertError } = await supabase.from('users').upsert({
                    id: user.uid,
                    name: updates.name,
                    phone: user.phone || '',
                    role: user.role || 'customer'
                })
                if (upsertError) throw upsertError
            }
        } catch (err: any) {
            if (err.message === 'Failed to fetch') {
                throw new Error('Database connection failed. Is your Supabase project paused?')
            }
            throw new Error(err.message || 'Failed to update profile in database')
        }

        setUser(prev => prev ? { ...prev, displayName: updates.name } : null)
    }

    return (
        <AuthContext.Provider value={{ user, loading, signOut, updateProfile }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
