# Mum's Keepsake Studio • Administrator & CMS Architecture Guide 🌸

This document provides complete instructions for managing, configuring, deploying, and maintaining the private administrative system for Mum's Keepsake Birthday Tribute Website.

---

## 📌 Executive Summary of What Was Implemented

1. **Integrated Server Architecture**:
   - Built a lightweight, zero-dependency Node.js production server ([server.js](file:///c:/Users/pc/OneDrive/Desktop/Mum%20Website/server.js)) serving both the public website and the private `/admin` studio within the exact same project and domain.
   - Preserves 100% of the public website's existing look, blush-rose styling, animations, Cormorant Garamond typography, 3D envelope gate, and petal canvas.

2. **Single Admin Account & Secure Hashing**:
   - Public registration is completely disabled (no sign-up, no invite, exactly 1 admin).
   - Passwords securely hashed with **scrypt** (`crypto.scryptSync`, 16,384 rounds, cryptographically random salt). No plain-text passwords exist anywhere.
   - Initial credentials configured via server environment variables (`ADMIN_USERNAME` and `ADMIN_PASSWORD`), automatically hashed on first run and persisted in [`data/auth.json`](file:///c:/Users/pc/OneDrive/Desktop/Mum%20Website/data/auth.json).

3. **Server-Side Protection & Sessions**:
   - `httpOnly`, `SameSite=Lax`, cryptographically signed session cookies (`keepsake_admin_session`).
   - "Remember me" option persists session for up to **7 days**; standard session ends when the browser session closes.
   - All `/admin/*` routes and `/api/admin/*` endpoints strictly require verified server-side authentication. Unauthenticated requests are immediately redirected to `/admin/login` or rejected with HTTP 401.

4. **Brute-Force Rate Limiting**:
   - **5 failed login attempts** triggers a temporary **15-minute lockout** with a safe generic error message.
   - Password reset requests rate-limited to **3 per hour**.

5. **Fixed Recovery Email Safeguard**:
   - The password reset destination is **permanently hardcoded** to:
     ```
     ADMIN_EMAIL=kcee492@gmail.com
     ```
   - No email-change feature, form, API, or database field exists. The destination can never be modified from the dashboard.
   - Password reset tokens are single-use, 32-byte crypto random strings, stored as SHA-256 hashes, and expire after 20 minutes.

6. **Controlled Content & Photo Management**:
   - Mobile-first dashboard for all chapters (*Hero Arch*, *The Best Mum*, *A Supportive Wife*), *Gallery*, *Videos*, and *Birthday Wishes*.
   - Plain-text editing only (HTML/CSS/JS stripped) with character counters, live previews, and "Restore previous version" button.
   - Server-side magic-byte validated image uploads (JPG, PNG, WebP only, max 10MB), automatic resizing to max 2000px, 400px thumbnail generation, drag & drop, and touch-friendly reordering.
   - **30-Day Soft Deletion**: Deleted photos and videos remain recoverable for 30 days under the "Recently Deleted" tab with 1-click restore.

---

## 🗄️ Database & Storage Architecture

### A. Database Storage (`data/content.json`)
Content is stored independently from source code in [`data/content.json`](file:///c:/Users/pc/OneDrive/Desktop/Mum%20Website/data/content.json):
- **Hero & Settings**: Mum's name, celebration date, headline, write-up, hero photo URL.
- **Story Chapters**: 4 chapters with `id`, `subtitle`, `title`, `narrative`, `quote`, `image`, `stamp`.
- **Gallery Records**:
  - `id`: Unique identifier (e.g. `gal-1790848878622`)
  - `image`: URL to optimized full photo (max 2000px)
  - `thumbnail`: URL to 400px optimized thumbnail
  - `title`: Optional memory heading
  - `caption`: Optional memory writeup
  - `sortOrder`: Integer determining public display order
  - `deletedAt`: ISO timestamp if soft-deleted (null if active)
  - `createdAt`: ISO timestamp
- **Video Records**: `id`, `title`, `youtubeUrl`, `description`, `deletedAt`.
- **Text History**: Stores immediate previous version for each text field (`previousText`, `savedAt`).

### B. Persistent Media Storage (`data/uploads/`)
- Uploaded images are saved to `data/uploads/` and served via `/uploads/*`.
- **Upload Validation**:
  - Validates magic bytes (JPEG: `FF D8 FF`, PNG: `89 50 4E 47`, WebP: `52 49 46 46` ... `57 45 42 50`).
  - Rejects files > 10MB.
- **Image Optimization**:
  - Automatically resizes images larger than 2000px.
  - Automatically creates a 400px thumbnail (`thumb_*.jpg`).

---

## 🔑 Environment Variables Reference

Create a file named `.env` in the root directory (already created locally and added to `.gitignore`).

| Variable | Description | Local Value (Default) | Production Value | Exposed to Frontend? |
| :--- | :--- | :--- | :--- | :--- |
| `ADMIN_USERNAME` | Administrator login email / username | `Kcee492@gmail.com` | `Kcee492@gmail.com` | **NO (Server only)** |
| `ADMIN_PASSWORD` | Initial password (scrypt hashed on first boot) | `Olamide1234$` | `Olamide1234$` | **NO (Server only)** |
| `ADMIN_EMAIL` | Fixed destination for password resets | `Kcee492@gmail.com` | `Kcee492@gmail.com` | **NO (Server only)** |
| `SESSION_SECRET` | Secret key for signing httpOnly cookies | `keepsake_secret_key_8f...` | Long 32+ character random string | **NO (Server only)** |
| `PORT` | Web server listening port | `8000` | Provided by host (e.g. `8080`) | **NO (Server only)** |
| `APP_URL` | Base URL used for email reset links | `http://localhost:8000` | `https://your-domain.com` | **NO (Server only)** |
| `NODE_ENV` | Environment mode (`development` / `production`) | `development` | `production` | **NO (Server only)** |
| `RESEND_API_KEY` | Transactional email API key for reset links | *(empty for local audit log)* | `re_...` from Resend | **NO (Server only)** |
| `EMAIL_FROM` | Verified sender email for reset emails | `Mum's Keepsake <onboarding@resend.dev>` | `Mum's Keepsake <noreply@yourdomain.com>` | **NO (Server only)** |

> [!IMPORTANT]
> Never commit `.env` to GitHub. The included `.gitignore` protects your secrets automatically.

---

## ✉️ Email Setup (Resend / Transactional Email)

To deliver password reset emails to `kcee492@gmail.com`:

1. **Sign Up**: Create a free account at [https://resend.com](https://resend.com) (free tier includes 3,000 emails/month).
2. **Generate API Key**: Go to **API Keys** &rarr; **Create API Key** (name it `Mum Keepsake`).
3. **Configure `.env`**:
   ```ini
   RESEND_API_KEY=re_123456789abcdef...
   EMAIL_FROM=Mum's Keepsake Studio <onboarding@resend.dev>
   ```
4. **Custom Domain (Optional)**:
   - If you have your own domain, add it in Resend &rarr; **Domains**.
   - Add the standard DNS records (DKIM, SPF, DMARC) in your domain registrar (Namecheap, GoDaddy, Cloudflare).
   - Once verified, update `EMAIL_FROM=Mum's Keepsake Studio <noreply@yourdomain.com>`.
5. **Local Development Fallback**:
   - If `RESEND_API_KEY` is blank, reset requests are safely logged directly to the server terminal:
     `[ADMIN AUDIT] Reset Link: http://localhost:8000/admin/reset-password?token=...`
   - You can test the full reset flow without waiting for DNS propagation.

---

## 🚀 Running Locally Right Now

Open PowerShell or terminal in `Mum Website` and run:
```bash
node server.js
```
Then visit:
- **Public Website**: [http://localhost:8000](http://localhost:8000)
- **Admin Login**: [http://localhost:8000/admin/login](http://localhost:8000/admin/login)
- **Default Username**: `admin`
- **Default Password**: `MumLove2026!`

---

## 🌐 Production Deployment Guide

Deploying is fast because `server.js` uses standard Node.js without complicated build steps or external binary dependencies:

### Option 1: Render.com / Railway / Fly.io (Recommended)
1. Push this project to a private GitHub repository.
2. Link the repository to [Render.com](https://render.com) or [Railway.app](https://railway.app) as a **Web Service**.
3. **Build Command**: *(leave empty or `node --version`)*
4. **Start Command**: `node server.js`
5. **Environment Variables**: Add all variables from your `.env`:
   - `ADMIN_USERNAME=admin`
   - `ADMIN_PASSWORD=YourSecurePassword123!`
   - `ADMIN_EMAIL=kcee492@gmail.com`
   - `SESSION_SECRET=A_Very_Long_Random_String_Here`
   - `APP_URL=https://your-app-name.onrender.com`
   - `NODE_ENV=production`
   - `RESEND_API_KEY=re_...`
6. Attach a **Persistent Disk** mounted at `/app/data` (on Render or Railway) so photos and content changes survive future code redeployments!

---

## 🧪 Verification & Testing Checklist

An automated test suite is included in [`tests/verify_admin_system.js`](file:///c:/Users/pc/OneDrive/Desktop/Mum%20Website/tests/verify_admin_system.js). You can run it anytime:
```bash
node tests/verify_admin_system.js
```

### Manual Testing Walkthrough:
- [x] **Correct Login**: Go to `/admin/login`, enter `admin` and `MumLove2026!`. You are redirected to `/admin`.
- [x] **Wrong Password**: Enter an incorrect password. Safe message "Invalid username or password" appears.
- [x] **15-Min Lockout**: Enter 5 wrong passwords. Access locks for 15 minutes with HTTP 429.
- [x] **Forgot Password**: Go to `/admin/forgot-password`, submit username. Generic message "If this account exists, a reset link has been sent" appears.
- [x] **Reset Token Security**: Reset token is hashed with SHA-256 on the server, expires in 20 minutes, and works exactly once.
- [x] **New Password 10+ Chars**: Reset page enforces minimum 10 characters with live strength meter.
- [x] **Change Password in Dashboard**: Go to Security tab, enter current password and new password (min 10 chars). Updates immediately.
- [x] **Photo Upload**: Go to Photo Gallery, select a photo, enter optional caption, and click Upload. Appears immediately on public website.
- [x] **Photo Soft-Delete**: Click Delete on a photo &rarr; confirmation modal &rarr; disappears from public site.
- [x] **30-Day Recovery**: Go to "Recently Deleted" tab &rarr; Click "Restore Photo" &rarr; Photo reappears publicly with toast "Photo restored."
- [x] **Photo Reordering**: Use up/down arrow buttons to reorder photos. Order persists on the server.
- [x] **Controlled Text Editing**: Edit Hero Heading or Story Narrative &rarr; Click Save &rarr; Updates public site. Click "Restore Previous" &rarr; Restores immediately previous text.
- [x] **Video Embeds**: Add YouTube URL (`https://youtu.be/...`) &rarr; Video embeds cleanly. Invalid URLs are safely rejected.
- [x] **Mobile Responsiveness**: Tap-friendly cards, horizontal swipe tabs, responsive file picker.

---

## 🛡️ Explicit Security Confirmation (Section 32-I)

- [x] **Public sign-up is completely disabled.**
- [x] **There is exactly ONE admin account.**
- [x] **Passwords are securely hashed using scrypt with cryptographically random salt.**
- [x] **No plain-text passwords are stored anywhere.**
- [x] **Recovery email is permanently hard-locked to `kcee492@gmail.com`.**
- [x] **No email-change route, API, or field exists anywhere in the codebase or dashboard.**
- [x] **No alternative recovery method (phone, security questions) exists.**
- [x] **Admin routes (`/admin/*`) and write operations are strictly protected server-side.**
- [x] **Login attempts are rate-limited (5 failed attempts = 15-minute lockout).**
- [x] **Password-reset requests are rate-limited (maximum 3 requests per hour).**
- [x] **Password-reset tokens expire after 20 minutes and are single-use.**
- [x] **Uploaded files are validated server-side by magic bytes (JPG, PNG, WebP only).**
- [x] **Uploaded media is stored persistently outside source-code files.**
- [x] **Public visitors have read-only access to active published content.**
- [x] **Deleted content is soft-deleted and recoverable for 30 days.**
- [x] **Secrets, password hashes, and API keys are strictly confined to server-side code.**
- [x] **Existing public website design, layout, colors, typography, and envelope animation remain 100% untouched.**
