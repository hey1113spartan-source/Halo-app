import React, { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import {
  checkUsernameAvailable,
  claimUsernameAndCreateProfile,
  createAccount,
  isUsernameFormatValid,
  logIn,
  normalizeUsername,
  resetPasswordByUsername,
} from "../lib/users.js";

function Brand() {
  return (
    <div className="halo-auth-brand">
      <div className="halo-auth-orb" />
      <span>Halo</span>
    </div>
  );
}

function useUsernameCheck(raw) {
  const [state, setState] = useState({ checking: false, available: null });
  useEffect(() => {
    const uname = normalizeUsername(raw);
    if (!uname || !isUsernameFormatValid(uname)) {
      setState({ checking: false, available: null });
      return;
    }
    setState({ checking: true, available: null });
    const t = setTimeout(async () => {
      try {
        const ok = await checkUsernameAvailable(uname);
        setState({ checking: false, available: ok });
      } catch {
        setState({ checking: false, available: null });
      }
    }, 400);
    return () => clearTimeout(t);
  }, [raw]);
  return state;
}

function PhotoPicker({ file, onChange }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="halo-photo-picker">
      <div className="halo-photo-picker-circle" onClick={() => inputRef.current?.click()}>
        {preview ? <img src={preview} alt="" /> : <Camera size={22} />}
      </div>
      <div className="halo-photo-picker-text">
        {preview ? "Looks good — tap to change" : "Add a profile photo (optional)"}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => onChange(e.target.files?.[0] || null)}
      />
    </div>
  );
}

export default function AuthFlow() {
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const unameCheck = useUsernameCheck(username);

  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [recoverValue, setRecoverValue] = useState("");

  async function handleSignUp(e) {
    e.preventDefault();
    setError("");
    if (!fullName.trim()) return setError("Enter your full name.");
    if (!isUsernameFormatValid(username)) return setError("Choose a valid username first.");
    if (unameCheck.available === false) return setError("That username is taken.");
    if (!email.includes("@")) return setError("Enter a valid email.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords don't match.");

    setBusy(true);
    try {
      await createAccount({ email, password, fullName, username, photoFile });
      setNote("Account created — check your inbox to verify your email.");
    } catch (err) {
      setError(err.message || "Something went wrong creating your account.");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogIn(e) {
    e.preventDefault();
    setError("");
    if (!loginUsername.trim() || !loginPassword) return setError("Enter your username and password.");
    setBusy(true);
    try {
      await logIn({ username: loginUsername, password: loginPassword });
    } catch (err) {
      setError(err.code === "auth/invalid-credential" ? "Wrong username or password." : err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRecover(e) {
    e.preventDefault();
    setError("");
    if (!recoverValue.trim()) return setError("Enter your username or email.");
    setBusy(true);
    try {
      await resetPasswordByUsername(recoverValue);
      setNote("If that account exists, a reset link is on its way.");
    } catch (err) {
      setError(err.message || "Couldn't send a reset link.");
    } finally {
      setBusy(false);
    }
  }

  if (mode === "forgot") {
    return (
      <div className="halo-auth-screen">
        <Brand />
        <h1 className="halo-auth-title">Reset your password</h1>
        <p className="halo-auth-sub">Enter your @username or email and we'll send a reset link.</p>
        {error && <div className="halo-auth-error">{error}</div>}
        {note && <div className="halo-auth-note">{note}</div>}
        <form onSubmit={handleRecover}>
          <div className="halo-field">
            <label>Username or email</label>
            <input value={recoverValue} onChange={(e) => setRecoverValue(e.target.value)} placeholder="@malli_07 or you@email.com" />
          </div>
          <button className="halo-auth-submit" disabled={busy} type="submit">
            {busy ? "Sending…" : "Send reset link"}
          </button>
        </form>
        <div className="halo-auth-switch">
          <button onClick={() => { setMode("login"); setError(""); setNote(""); }}>Back to log in</button>
        </div>
      </div>
    );
  }

  if (mode === "signup") {
    return (
      <div className="halo-auth-screen">
        <Brand />
        <h1 className="halo-auth-title">Create your account</h1>
        <p className="halo-auth-sub">Everything you need. One place.</p>
        {error && <div className="halo-auth-error">{error}</div>}
        {note ? (
          <div className="halo-auth-note">{note}</div>
        ) : (
          <form onSubmit={handleSignUp}>
            <PhotoPicker file={photoFile} onChange={setPhotoFile} />
            <div className="halo-field">
              <label>Full name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Alex Rivera" />
            </div>
            <div className="halo-field">
              <label>Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
                placeholder="malli_07"
              />
              {username && (
                <span
                  className={`halo-field-hint ${
                    unameCheck.available === true ? "is-good" : unameCheck.available === false ? "is-bad" : ""
                  }`}
                >
                  {!isUsernameFormatValid(username)
                    ? "3-20 characters: lowercase letters, numbers, underscore"
                    : unameCheck.checking
                    ? "Checking availability…"
                    : unameCheck.available === true
                    ? `@${normalizeUsername(username)} is available`
                    : unameCheck.available === false
                    ? "Already taken"
                    : ""}
                </span>
              )}
            </div>
            <div className="halo-field">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
            </div>
            <div className="halo-field">
              <label>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
            </div>
            <div className="halo-field">
              <label>Confirm password</label>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Retype your password" />
            </div>
            <button className="halo-auth-submit" disabled={busy} type="submit">
              {busy ? "Creating account…" : "Create account"}
            </button>
          </form>
        )}
        <div className="halo-auth-switch">
          Already have an account? <button onClick={() => { setMode("login"); setError(""); setNote(""); }}>Log in</button>
        </div>
      </div>
    );
  }

  return (
    <div className="halo-auth-screen">
      <Brand />
      <h1 className="halo-auth-title">Welcome back</h1>
      <p className="halo-auth-sub">Log in with your username to keep going.</p>
      {error && <div className="halo-auth-error">{error}</div>}
      <form onSubmit={handleLogIn}>
        <div className="halo-field">
          <label>Username</label>
          <input value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} placeholder="@malli_07" />
        </div>
        <div className="halo-field">
          <label>Password</label>
          <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="Your password" />
        </div>
        <div className="halo-auth-forgot">
          <button type="button" onClick={() => { setMode("forgot"); setError(""); setNote(""); }}>
            Forgot password?
          </button>
        </div>
        <button className="halo-auth-submit" disabled={busy} type="submit">
          {busy ? "Logging in…" : "Log in"}
        </button>
      </form>
      <div className="halo-auth-switch">
        New here? <button onClick={() => { setMode("signup"); setError(""); setNote(""); }}>Create an account</button>
      </div>
    </div>
  );
}

export function CompleteProfileScreen({ user }) {
  const [fullName, setFullName] = useState(user.displayName || "");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const unameCheck = useUsernameCheck(username);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!fullName.trim()) return setError("Enter your full name.");
    if (!isUsernameFormatValid(username)) return setError("Choose a valid username.");
    if (unameCheck.available === false) return setError("That username is taken.");
    setBusy(true);
    try {
      await claimUsernameAndCreateProfile(user.uid, {
        email: user.email,
        fullName,
        username,
        photoURL: user.photoURL,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="halo-auth-screen">
      <Brand />
      <h1 className="halo-auth-title">Finish setting up</h1>
      <p className="halo-auth-sub">Your account exists — just need a username to finish.</p>
      {error && <div className="halo-auth-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="halo-field">
          <label>Full name</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Alex Rivera" />
        </div>
        <div className="halo-field">
          <label>Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))} placeholder="malli_07" />
          {username && (
            <span className={`halo-field-hint ${unameCheck.available === true ? "is-good" : unameCheck.available === false ? "is-bad" : ""}`}>
              {unameCheck.checking ? "Checking availability…" : unameCheck.available === false ? "Already taken" : unameCheck.available === true ? "Available" : ""}
            </span>
          )}
        </div>
        <button className="halo-auth-submit" disabled={busy} type="submit">
          {busy ? "Saving…" : "Finish setup"}
        </button>
      </form>
    </div>
  );
}
