import React, { useState } from "react";
import {
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  linkWithPopup,
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import { useAuth } from "./AuthContext";

export default function Login() {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  
  const googleSignIn = async () => {
    try {
      
      googleProvider.addScope("https://www.googleapis.com/auth/calendar.events");
      const result = await signInWithPopup(auth, googleProvider);

      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      if (token) {
        sessionStorage.setItem("googleAccessToken", token);
      }
    } catch (err) {
      console.error("Google sign-in error:", err);
      alert(err.message || "Google sign-in failed");
    }
  };


  const linkGoogleToAccount = async () => {
    if (!user) {
      alert("Sign in first with your email account, then link Google.");
      return;
    }
    try {
      googleProvider.addScope("https://www.googleapis.com/auth/calendar.events");
      const result = await linkWithPopup(user, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      if (token) sessionStorage.setItem("googleAccessToken", token);
      alert("Google account linked! You can now add events to Calendar.");
    } catch (err) {
      console.error("Linking error:", err);
      alert(err.message || "Failed to link Google account");
    }
  };

  const emailSignup = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
     
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const emailLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      sessionStorage.removeItem("googleAccessToken");
    } catch (err) {
      console.error(err);
    }
  };

  if (user === undefined) return <div style={{ padding: 20 }}>loading auth…</div>;

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <h2 style={{ marginBottom: 12 }}>Welcome — Login to save your tasks</h2>

        {user ? (
          <>
            <p style={{ color: "#aaa" }}>Signed in as {user.displayName || user.email}</p>

           
            {!user.providerData.some((p) => p.providerId === "google.com") && (
              <button onClick={linkGoogleToAccount} style={styles.btnOutline}>
                Link Google (for Calendar)
              </button>
            )}

            <button style={styles.signBtn} onClick={logout}>Logout</button>
          </>
        ) : (
          <>
            <input
              style={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              type="email"
            />
            <input
              style={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              type="password"
            />

            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <button style={styles.btn} onClick={emailLogin}>Login</button>
              <button style={styles.btnOutline} onClick={emailSignup}>Signup</button>
            </div>

            <div style={{ textAlign: "center", margin: "12px 0", color: "#888" }}>or</div>

            <button style={styles.google} onClick={googleSignIn}>Continue with Google</button>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  wrap: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#111" },
  card: { background: "#1f1f1f", color: "white", padding: 24, borderRadius: 12, width: 360, boxShadow: "0 8px 20px rgba(0,0,0,0.3)" },
  input: { width: "100%", padding: 10, borderRadius: 10, border: "1px solid #444", marginBottom: 8, background: "#222", color: "white" },
  btn: { flex: 1, padding: 10, borderRadius: 10, border: "none", background: "#3b82f6", color: "white", cursor: "pointer" },
  btnOutline: { flex: 1, padding: 10, borderRadius: 10, border: "1px solid #555", background: "transparent", color: "white", cursor: "pointer" },
  signBtn: { padding: 10, borderRadius: 10, border: "1px solid #444", background: "transparent", color: "white", cursor: "pointer", width: "100%" },
  google: { width: "100%", padding: 10, borderRadius: 10, border: "none", background: "white", color: "#222", cursor: "pointer", fontWeight: 600 },
};
