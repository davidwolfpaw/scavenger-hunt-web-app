# Scavenger Hunt Game

Host your own digital scavenger hunt game! You can use URLs, NFC Tags, QR Codes, or any combination of them to allow users to hunt for clues and stamp a digital passbook showing that they've obtained each clue.

Users can view their progress in real time, whether having to collect individual clues, or a set number of them to reach levels that you set beforehand.

This app generates the URLs and QR Codes needed to play, as well as allows an admin view of each registered user and how far they've completed.

## Features

- User authentication and profiles
- Customizable scavenger hunts
- Real-time progress tracking
- Leaderboards and achievements
- Mobile-friendly interface

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Installation

```bash
git clone https://github.com/davidwolfpaw/scavenger-hunt-game.git
cd scavenger-hunt-game
npm install
```

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

### Running the App

```bash
npm start
```

The app will automatically create all tables and seed tags from your config when it starts.

---

## Admin Setup Checklist

To get your scavenger hunt up and running:

1. ✅ **Configure Hunt Details** — Edit `public/config.json`:
   - Update `scavengerHuntName` and `timezone`
   - Define your `tagStamps` with IDs and names
   - Set badge `level` thresholds if desired
   - Optionally customize any UI labels via the `strings` section

2. ✅ **Set Environment Variables** — Edit `.env`:
   - Set `PUBLIC_URL` (used for QR code generation)
   - Set `SECRET_KEY` (for JWT tokens)

3. ✅ **Start the App** — Run `npm start`
   - Database tables and tags are created automatically
   - No manual tag setup needed if `public/config.json` is setup

4. ✅ **Create an Admin User** — Register at `/login.html` with a test identifier
   - After registering, manually set `is_admin = 1` in the database to grant admin access
   - Or add it programmatically in a seed script

5. ✅ **Access Admin Panel** — Log in as admin and go to `/admin.html`
   - View all users and their progress
   - Download QR codes for each tag
   - Monitor first-to-complete and leaderboard stats

---

## Setup & Customization

Before running your hunt, customize these three main areas. Tags are automatically seeded from your config when the app starts.

### 1. Environment Variables (`.env`)

| Variable | Description |
|---|---|
| `PUBLIC_URL` | The public-facing URL of your site (no trailing slash). Used to generate QR codes and scan links. |
| `SECRET_KEY` | A secret string for signing JWT tokens. Generate one with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `PORT` | The port the server listens on. Defaults to `3000`. |

### 2. Hunt Configuration (`public/config.json`)

This file controls the name, stamps, and badge levels for your hunt.

| Field | Required | Description |
|---|---|---|
| `scavengerHuntName` | Yes | Displayed in the `<title>` of each page. |
| `defaultStampImage` | Yes | Path to the default stamp image, used as a fallback when a tag doesn't have its own image. |
| `totalTags` | Yes | The total number of tags in the hunt. |
| `tagPositions` | No | Maps each tag identifier to a display position, so stamps appear in a fixed order rather than scan order. |
| `tagStamps` | Yes | An object keyed by tag identifier. Each entry can have a `name` (displayed label) and an `image` (path to a custom stamp image). |
| `badges` | No | An array of achievement levels. Each badge has a `level` (number of tags needed), a `name`, an `enabled` flag, and an `image`. |
| `strings` | No | An object of UI text strings, organized by page/section. Allows customizing all user-facing text without editing source files. See [UI Strings](#5-ui-strings-publicconfigjson) below. |
| `theme` | No | Name of the CSS theme file to load from `public/assets/css/`. Defaults to `"default"` (`default.css`). If the named file is not found, falls back to `default.css`. |
| `timezone` | No | IANA timezone string (e.g. `"America/New_York"`). Used to determine the current event date when recording and querying scans. Defaults to `America/New_York`. |

Example `tagStamps` entry:

```json
"my-tag-id": {
  "name": "Main Stage",
  "image": "/assets/img/my-stamp.png"
}
```

### 3. Images (`public/assets/img/`)

Replace any of the default images with your own. All paths are relative to the `public/` directory.

| File | Used for |
|---|---|
| `stamp-paw.png` | Default stamp image (referenced by `defaultStampImage` in config.json) |
| `stamp-ballroom.png`, `stamp-billiard.png`, `stamp-conservatory.png`, `stamp-hall.png`, `stamp-kitchen.png`, `stamp-library.png`, `stamp-lounge.png`, `stamp-study.png` | Example per-tag stamp images |
| `stamp-beginner.png` | Badge image for the Beginner level |
| `stamp-intermediate.png` | Badge image for the Intermediate level |
| `stamp-advanced.png` | Badge image for the Advanced level |

Images can be any web-friendly format (PNG, SVG, WebP, etc.) as long as the paths in `config.json` match.

### 4. Themes (`public/assets/css/`)

The app supports CSS themes selectable via `config.json`. Set the `theme` field to the name of any `.css` file in `public/assets/css/` (without the `.css` extension):

```json
"theme": "dark"
```

This loads `public/assets/css/dark.css`. If the file does not exist, the app automatically falls back to `default.css`.

**Creating a custom theme:**

1. Copy `public/assets/css/default.css` to a new file, e.g. `public/assets/css/mytheme.css`
2. Edit the CSS variables at the top of the file, or override any rules you want to change
3. Set `"theme": "mytheme"` in `config.json`

The built-in CSS variables you can override in a theme:

```css
:root {
  --primary-color: #194f90;
  --secondary-color: #00aeef;
  --background-color: #fceec0;
  --text-color: #010101;
}
```

### 5. UI Strings (`public/config.json`)

All user-facing text in the app is configurable via the `strings` object in `config.json`. This lets you rename labels, reword messages, or translate the interface without touching any source files.

Strings are organized by section. Any key you omit will fall back to the built-in default. Only include the keys you want to change.

```json
"strings": {
  "nav": {
    "scan": "Scan",
    "progress": "Progress",
    "admin": "Admin",
    "tags": "Tags",
    "logout": "Logout",
    "login": "Login",
    "register": "Register"
  },
  "index": {
    "heading": "Welcome to the Scavenger Hunt!",
    "intro": "Join our exciting scavenger hunt..."
  },
  "login": {
    "heading": "Scavenger Hunt Portal",
    "loginTab": "Login",
    "registerTab": "Register",
    "loginHeading": "Login",
    "nameLabel": "Your Name:",
    "identifierLabel": "Unique Identifier:",
    "loginButton": "Login",
    "registerHeading": "Register",
    "registerButton": "Register",
    "successRegistered": "Registered successfully! Logging in...",
    "errorLoginAfterRegister": "Error logging in after registration.",
    "errorNetwork": "Network error or server is down.",
    "errorInvalidCredentials": "Invalid credentials",
    "errorInvalidResponse": "Error: Invalid server response"
  },
  "progress": {
    "heading": "Your Progress",
    "loading": "Loading...",
    "notRegistered": "You are not registered. Please <a href=\"login.html\">log in or register</a>.",
    "errorConfig": "Failed to load configuration.",
    "errorInvalidResponse": "Error: Invalid server response",
    "welcome": "Welcome, {name} ({identifier})!",
    "foundSingular": "You've found 1 tag!",
    "foundPlural": "You've found {count} tags!",
    "yourBadge": "Your Badge: {badge}",
    "noBadge": "No badge yet",
    "errorLoading": "Error loading progress: {error}",
    "errorNetwork": "Network error or server is down."
  },
  "scan": {
    "heading": "Scan A Code",
    "loading": "Loading...",
    "startScan": "Start QR Scan",
    "nfcStarted": "NFC reader started. Tap an NFC tag.",
    "nfcFailed": "NFC scan failed: {error}",
    "nfcNotSupported": "NFC not supported on this device.",
    "alreadyScanned": "You already found this one!",
    "scanSuccess": "Tag logged successfully!",
    "scanFailed": "Scan failed: {error}",
    "errorNetwork": "Network or server error during scan.",
    "tagSaved": "Tag saved! Please log in or register to save your progress.",
    "noTag": "No tag provided."
  },
  "admin": {
    "heading": "Admin Dashboard",
    "selectView": "Select a view to load data...",
    "viewByUser": "Scans by User",
    "viewByClue": "Scans by Clue",
    "viewFirstComplete": "First to Complete",
    "loading": "Loading...",
    "errorNoToken": "Admin token not found. Redirecting to login...",
    "errorFetch": "Error fetching data",
    "errorFailedToLoad": "Failed to load data.",
    "colName": "Name",
    "colIdentifier": "Identifier",
    "colScanCount": "Scan Count",
    "colComplete": "Complete",
    "colClue": "Clue",
    "colCompletedAt": "Completed At",
    "completeCheckmark": "✔️"
  },
  "tags": {
    "heading": "Printable QR Tags",
    "loading": "Loading...",
    "downloadQR": "Download QR"
  }
}
```

Several strings support `{placeholder}` tokens that are filled in at runtime:

| String key | Available tokens |
|---|---|
| `progress.welcome` | `{name}`, `{identifier}` |
| `progress.foundPlural` | `{count}` |
| `progress.yourBadge` | `{badge}` |
| `progress.errorLoading` | `{error}` |
| `scan.nfcFailed` | `{error}` |
| `scan.scanFailed` | `{error}` |

### 4. Tags (Auto-Seeded from Config)

Tags are automatically created from the `tagStamps` configuration in `public/config.json` when the app starts. The app will skip any tags that already exist in the database, so you can safely restart the app without duplicating tags.

To add or modify tags:
1. Edit the `tagStamps` object in `public/config.json`
2. Restart the app — new tags will be automatically seeded into the database

The admin panel at `/admin.html` (when logged in as an admin) displays all tags and lets you download their QR codes ready to print.

---

## Test Data

`scripts/seed-test-data.js` populates the database with sample users, tags, and scans for local testing. It is safe to run in development and should not be used in production.

```bash
node scripts/seed-test-data.js
```

The seed script creates 10 users (2 admin, 8 regular) and 8 tags with varying scan coverage, so you can see the leaderboard and completion views with realistic data.

---

## Running Tests

```bash
npm test
```

Tests use an in-memory SQLite database and do not affect your local database file.

---

## Contributing

Contributions are welcome! Please open issues or submit pull requests.

## License

This project is licensed under the MIT License.
