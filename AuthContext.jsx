import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(undefined); 

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
    });
    return () => unsub();
  }, []);

  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  );
};
