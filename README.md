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
   - Update `scavengerHuntName`
   - Define your `tagStamps` with IDs and names
   - Set badge `level` thresholds if desired

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
