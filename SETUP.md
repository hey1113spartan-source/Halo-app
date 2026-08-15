# Halo — Firebase setup & deploy (Android-only guide)

This turns the code into a live app with real accounts, friends, and chat.
No computer needed — every step below works from Chrome on your phone.
Budget ~45–60 minutes the first time.

The path: **Firebase project → code onto GitHub → Netlify builds it →
test on the live URL → wrap with Web2Apk**, same last step you already
used for Malli's Circle.

---

## 0. One important choice up front: profile photos

Google now requires the paid **Blaze** plan (still free at your scale, but
needs a linked card) for Firebase Storage — the piece that stores uploaded
profile photos. Everything else (accounts, usernames, friends, real-time
chat) runs entirely on the free **Spark** plan.

- **Skip photo uploads for now** → stay on Spark, no card needed. Everyone
  just gets an initials avatar (already built in, looks fine). You can add
  Storage later with zero code changes.
- **Want real photo uploads** → upgrade to Blaze when you create the
  project (Firebase Console → ⚙️ Project settings → Usage and billing →
  Modify plan). You won't be charged unless you go far past the free
  quotas (5 GB stored, 1 GB/day downloaded).

Pick whichever — the rest of this guide works either way. Skip section 1.4
if you're skipping Storage.

---

## 1. Set up Firebase

Open **console.firebase.google.com** in Chrome. (Tip: tap Chrome's ⋮ menu →
"Desktop site" — the console is easier to tap through that way.)

### 1.1 Create the project
1. Tap **Add project**.
2. Name it (e.g. `halo-app`) → Continue.
3. Google Analytics prompt — either choice is fine → Create project.

### 1.2 Turn on Authentication
1. Left menu (☰) → **Build → Authentication** → Get started.
2. **Sign-in method** tab → **Email/Password** → toggle Enable → Save.

### 1.3 Create Firestore
1. **Build → Firestore Database** → Create database.
2. Choose **Start in production mode** (we're supplying real rules) →
   pick a location close to you → Enable.
3. Once it's created, open the **Rules** tab. Delete everything in the box
   and paste in the entire contents of `firestore.rules` from the project
   (open it from the files I gave you, select all, copy). Tap **Publish**.
4. Composite indexes — the easiest way: skip this for now. The first time
   the app runs a query that needs one, Firestore throws an error in the
   browser console with a direct "Create index" link — tapping it opens a
   pre-filled page in the console; just tap **Create**. It takes a couple
   of minutes to build. You'll hit this at most 3 times total (chat list,
   incoming requests, outgoing requests). If you'd rather pre-create them:
   **Indexes** tab → **Composite** → **Add index**, and enter the fields
   listed in `firestore.indexes.json`.

### 1.4 Create Storage (only if you chose photo uploads)
1. First confirm you're on the Blaze plan: ⚙️ **Project settings → Usage
   and billing → Modify plan → Blaze** → link a card.
2. **Build → Storage** → Get started → production mode → same location as
   Firestore → Done.
3. **Rules** tab → replace with the contents of `storage.rules` → Publish.

### 1.5 Get your web config
1. ⚙️ (top left, next to "Project Overview") → **Project settings**.
2. Scroll to **Your apps** → tap the **`</>`** (web) icon.
3. Nickname it (e.g. `halo-web`) → **Register app**. Skip the "Firebase
   Hosting" checkbox — you're using Netlify.
4. You'll see a code block with `apiKey`, `authDomain`, `projectId`,
   `storageBucket`, `messagingSenderId`, `appId`. Keep this screen open in
   a tab — you'll copy these six values into Netlify in step 3.

---

## 2. Get the code onto GitHub

### 2.1 Extract the project
Download the `halo-firebase.zip` file, then extract it with your phone's
file manager (Google Files → tap the zip → Extract; most file managers
have this built in).

### 2.2 Create the repository
1. In Chrome, go to **github.com** → sign in (or create an account).
2. Tap **+** → **New repository**.
3. Name it `halo-app`, Public or Private (your call) → **Create repository**
   — leave it empty, don't add a README.

### 2.3 Add the files
The most reliable way on mobile is **Add file → Create new file**, typing
the *full path* into the filename box — GitHub creates the folders for you
automatically. Open each file (from the individually-shared files, or from
the extracted zip in a text viewer), copy its contents, and paste:

1. Tap **Add file → Create new file**.
2. In the name box type the exact path, e.g. `src/firebase.js`.
3. Paste that file's contents into the big text box below.
4. Scroll down → **Commit changes**.
5. Repeat for every file. There are 24 in total — tedious but 100%
   reliable, no drag-and-drop guesswork:

```
package.json
vite.config.js
index.html
.env.example
firestore.rules
firestore.indexes.json
storage.rules
src/main.jsx
src/App.jsx
src/firebase.js
src/styles.css
src/lib/ids.js
src/lib/users.js
src/lib/friends.js
src/lib/chat.js
src/lib/format.js
src/contexts/AuthContext.jsx
src/components/ui.jsx
src/screens/AuthScreens.jsx
src/screens/HomeScreen.jsx
src/screens/SearchScreen.jsx
src/screens/RequestsScreen.jsx
src/screens/ChatScreens.jsx
src/screens/ProfileScreen.jsx
src/screens/PlaceholderScreens.jsx
```

Shortcut worth trying first: on the empty repo's page there's also an
**"uploading an existing file"** link → this opens a picker where you can
multi-select several files at once from one folder level (e.g. everything
directly inside `src/lib/`). It won't preserve folder nesting reliably on
Android, so you'll still need to fix paths for anything that lands in the
wrong place — but it can save time for the flatter folders. If it gets
confusing, fall back to the one-by-one method above; it always works.

---

## 3. Connect Netlify

1. Go to **app.netlify.com** → sign up/log in (choosing "Sign up with
   GitHub" links the accounts automatically).
2. **Add new site → Import an existing project → Deploy with GitHub** →
   authorize Netlify if asked → pick your `halo-app` repo.
3. Build settings — Netlify should auto-detect Vite:
   - Build command: `npm run build`
   - Publish directory: `dist`
   (If they're blank, type them in.)
4. Before the first deploy finishes, go to **Site configuration →
   Environment variables → Add a variable**, and add all six, using the
   values from your Firebase config screen (step 1.5):

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

5. **Deploys** tab → **Trigger deploy → Deploy site** (so the build picks
   up the variables you just added).
6. Once it says "Published," open the `*.netlify.app` link it gives you —
   optionally rename it under **Site configuration → Change site name**,
   same as you did for Malli's Circle.

---

## 4. Test it

On the live URL: create an account, note that your @username shows a live
"available/taken" check as you type, log out, log back in with just the
username + password, then from a second account (or ask a friend) search
for your @username, send a request, accept it, and chat — you should see
the message land instantly, the tick change from sent → delivered → seen,
and the online dot reflect whether the other side has the app open.

If a screen shows a red error mentioning "index," that's the composite
index prompt from step 1.4 — tap the link in the browser console/error
message and create it, then retry.

---

## 5. Wrap it as an Android app

Same as Malli's Circle: open Web2Apk, point it at your new `*.netlify.app`
URL, and build the APK.

---

## What's intentionally simplified for v1

- **Presence** uses a heartbeat (the app pings every ~25s while open) to
  show online/offline, not a true instant-disconnect signal. Realtime
  Database has a proper `onDisconnect()` for that — worth adding later
  since you already have an RTDB-enabled project from Malli's Circle.
- **Username login** needs to resolve @username → email before Firebase
  Auth can sign in, which means a signed-in user's email is technically
  readable by anyone who queries their exact profile doc (not shown
  anywhere in the UI, but visible to someone poking at devtools). Closing
  this fully needs a Cloud Function (Blaze plan) to do that lookup
  server-side instead.
- **Username squatting**: the security rules stop anyone from taking a
  username that's already claimed, but don't stop one account from ever
  claiming a second username via a client bug — also a Cloud Function
  fix, not urgent for a friends app.
- Delivered/seen receipts are done entirely client-side (no Cloud
  Functions), which is standard for a Spark-plan app but means a message
  only gets marked "delivered" once the recipient's app actually receives
  it live — not from a push notification while the app is closed.
