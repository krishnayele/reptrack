# RepTrack — AI Exercise Counter

Count push-ups, sit-ups, and squats in real time using your webcam.  
No account. No server. No data leaves your browser.

Built with [MediaPipe Pose](https://developers.google.com/mediapipe/solutions/vision/pose_landmarker) — Google's on-device AI that detects 33 body landmarks per frame and runs entirely client-side via WebAssembly.

---

## What it tracks

| Exercise   | How detection works |
|------------|---------------------|
| Push-ups   | Average elbow angle (< 90° = down, > 155° = up → counted) |
| Sit-ups    | Average hip angle — shoulder/hip/knee (< 60° = up, > 120° = down → counted) |
| Squats     | Average knee angle — hip/knee/ankle (< 100° = down, > 160° = up → counted) |

---

## Requirements

- A **modern browser** (Chrome 90+ recommended; Edge, Firefox, Safari 15+ work)
- A **webcam** (built-in laptop camera is fine)
- **HTTPS or localhost** — the browser only allows camera access on secure origins  
  _(free hosting platforms like GitHub Pages and Netlify provide HTTPS automatically)_

---

## Run it locally

> **Do not open `index.html` by double-clicking it.**  
> The `file://` protocol blocks camera access AND service workers.  
> Use a local web server instead — both options below start one in seconds.

**Option A — Node (if you have Node.js installed):**
```
npx serve .
```
Then open the URL it prints (usually `http://localhost:3000`).

**Option B — Python:**
```
python -m http.server 8080
```
Then open `http://localhost:8080` in your browser.

---

## Project file structure

```
exercise-website/
│
├── index.html              ← App shell (HTML only, no inline CSS/JS)
├── manifest.json           ← PWA manifest (makes the app installable)
├── sw.js                   ← Service worker (enables offline use)
├── .gitignore
├── README.md
│
└── assets/
    ├── css/
    │   └── style.css       ← All styles (dark/light theme, layout)
    │
    ├── js/
    │   ├── exercises.js    ← Exercise definitions + angle maths
    │   │                     ← ADD NEW EXERCISES HERE
    │   ├── pose.js         ← MediaPipe init, camera loop, skeleton draw
    │   └── ui.js           ← DOM wiring, controls, history, timer
    │
    └── icons/
        ├── icon-192.svg    ← PWA icon (192×192)
        └── icon-512.svg    ← PWA icon (512×512)
```

---

## Free hosting (choose any one)

### Option 1 — GitHub Pages (completely free, permanent URL)

1. Create a free account at [github.com](https://github.com)
2. Click **+** → **New repository** → name it `reptrack` → **Create repository**
3. Open a terminal in the `exercise-website` folder and run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/reptrack.git
   git push -u origin main
   ```
4. Go to your repo on GitHub → **Settings** → **Pages**  
   Under *Source*, choose **Deploy from a branch** → `main` → `/ (root)` → **Save**
5. Wait ~60 seconds, then your site is live at:  
   `https://YOUR_USERNAME.github.io/reptrack/`

> ⚠️ **GitHub Pages subpath note:** When hosted at `/reptrack/` (not the root), update `manifest.json`:
> - Change `"start_url": "/"` to `"start_url": "/reptrack/"`
> - Update the SW registration to: `navigator.serviceWorker.register('/reptrack/sw.js')`


### Option 2 — Netlify (free, drag-and-drop, no Git required)

1. Go to [app.netlify.com](https://app.netlify.com) → sign up free
2. On the dashboard, just **drag and drop the entire `exercise-website` folder** onto the page
3. Done — Netlify gives you a live HTTPS URL instantly (e.g. `https://random-name.netlify.app`)
4. To update: drag the folder again, or connect your GitHub repo for automatic deploys


### Option 3 — Vercel (free, CLI)

1. Install: `npm install -g vercel`
2. In the project folder run: `vercel`
3. When asked for the framework preset, select **Other**
4. Your site is live at `https://reptrack.vercel.app` (or similar)


---

## Installing as a phone/desktop app

Once deployed on HTTPS, the browser offers to install it as an app:

- **Chrome desktop** → look for the install icon (⊕) in the address bar
- **Android Chrome** → tap ⋮ menu → "Add to Home Screen"
- **iPhone (Safari)** → tap the share icon → "Add to Home Screen"

After install it opens full-screen with no browser chrome, and works offline for exercises you've done before.

---

## Adding a new exercise

All exercise logic lives in **`assets/js/exercises.js`**.

1. Write a counter function that accepts `(landmarks, state)` and returns:
   ```js
   { counted: boolean, phase: 'up' | 'down' | 'ready', conf: number }
   ```
   - `landmarks` — MediaPipe's array of 33 pose landmark objects (`{x, y, z, visibility}`)
   - `state` — a plain object you can use to track phase between frames
   - `conf` — confidence score 0–1 (use `Math.min(pt1.visibility, pt2.visibility, …)`)

2. Add an object to the `EXERCISES` array:
   ```js
   {
     id:      'lunges',       // unique string key
     name:    'Lunges',       // shown in sidebar
     icon:    '🏃',           // emoji
     hint:    'Face the camera side-on',
     tips:    ['Keep your front knee above your ankle', '…'],
     counter: lungeCounter,   // the function you wrote
   }
   ```

3. That's it — the sidebar button, rep counter, history log, and tips accordion all build themselves from this array.

---

## How the offline/PWA caching works

The service worker (`sw.js`) uses two strategies:

| Resource type | Strategy | Why |
|---|---|---|
| App shell (HTML, CSS, local JS, icons) | Cache-first | Fast loads, works offline |
| MediaPipe CDN (JS, WASM, model files) | Network-first → cache fallback | Models stay current; work offline after first use |

> **First visit:** The app downloads ~10 MB of MediaPipe model files. After that, everything loads from cache — even with no internet.

---

## Tips for accurate counting

- **Push-ups:** Camera at floor level, side-on. Full extension at the top is required.
- **Sit-ups:** Camera at mid-height, side-on. Feet should stay on the floor.
- **Squats:** Camera at thigh height, side-on. Lower until thighs are parallel to the floor.
- **Lighting:** Make sure you're well-lit from the front. Dark backgrounds with a bright light source behind you confuse the model.
- **Frame yourself fully:** All limbs in frame improves detection confidence.

---

## Privacy

All video processing happens on your device using WebAssembly. No images, video frames, or pose data are ever sent to any server. The only network requests are loading the MediaPipe model files from jsDelivr CDN on first visit.
