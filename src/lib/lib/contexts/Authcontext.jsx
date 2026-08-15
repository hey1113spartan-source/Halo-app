import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase.js";
import { touchPresence, logOut as logOutFn } from "../lib/users.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      setProfile(snap.exists() ? snap.data() : null);
      setProfileLoading(false);
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    touchPresence(user.uid);
    const onFocus = () => touchPresence(user.uid);
    window.addEventListener("focus", onFocus);
    window.addEventListener("visibilitychange", onFocus);
    const interval = setInterval(() => touchPresence(user.uid), 25000);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("visibilitychange", onFocus);
      clearInterval(interval);
    };
  }, [user]);

  const loading = user === undefined || (!!user && profileLoading);

  return (
    <AuthContext.Provider value={{ user: user || null, profile, loading, logOut: logOutFn }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
