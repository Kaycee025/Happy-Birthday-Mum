# Mum's Keepsake Birthday Tribute Website 💌
*A private, feminine, warm, and elegant digital keepsake book for Mum's birthday on December 23rd.*

---

## 🌸 Overview
This website is crafted as a digital keepsake book designed with soft blush, cream, dusty rose, sage, and champagne gold tones. It features:
1. **Gate Page**: Floating rose petals canvas, countdown to December 23rd, and a 3D sealed envelope with wax heart seal that opens with an unfolding animation into the keepsake story.
2. **Keepsake Story**: Arched hero frame with Mum's photo, alternating left/right layout for heartfelt story chapters (*"The Best Mum"*, *"A Supportive Wife"*).
3. **Photo Gallery**: Soft grid of photographs with "New" memory badges and full-screen lightbox.
4. **Video Messages**: Responsive embeds for unlisted family YouTube videos.
5. **Birthday Wishes Guestbook**: Interactive form for family to leave loving notes.
6. **Background Music**: Built-in soothing synthesized harp lullaby (plays via Web Audio API, zero broken links, off by default), with support for linking Mum's favorite MP3.
7. **Admin Studio (`/admin.html`)**: Password-protected studio to live-edit text, upload photos with client-side compression, add videos, and sync to Supabase.

---

## 📋 What Details, Photos & Files You Need to Provide

The website is currently pre-loaded with high-resolution editorial portrait placeholders and sample stories so you can see it working immediately. To make it truly hers, here is your exact checklist:

### 1. Mum's Personal Details
- **Mum's Full Name / Nickname**: (e.g., *Evelyn*, *Mama Sarah*).
- **Her Birthday**: December 23rd (pre-configured in the countdown).
- **Short Opening Write-up**: 2 to 3 sentences expressing your love to open the keepsake.

### 2. Photos Checklist (Save in `assets/images/` or upload via Admin)
For best results, choose clear, warm, high-resolution photos:
| Section | Recommended Photo Type | Current Placeholder |
| :--- | :--- | :--- |
| **Hero Arch** | Vertical portrait of Mum smiling, warm lighting | `assets/images/hero-mum.jpg` |
| **The Best Mum** | Candid photo of Mum hugging or laughing with her children | `assets/images/best-mum.jpg` |
| **She Trained Us Well** | Photo showing her wisdom, guidance, teaching, or proud milestone | `assets/images/trained-us.jpg` |
| **A Supportive Wife** | Photo of Mum and Dad together, romantic or joyful | `assets/images/supportive-wife.jpg` |
| **Gallery Photos** | 4 to 20 cherished moments (holidays, birthdays, family dinners) | `assets/images/gallery-1.jpg` to `gallery-4.jpg` |

> 💡 **Tip:** You do not need to resize or compress photos manually! The built-in Admin Studio automatically compresses your photos on your device before saving, ensuring fast mobile loading.

### 3. Story Chapters & Memories
You can customize the write-ups directly in the **Admin Studio (`admin.html`)**:
- **The Best Mum**: Her maternal love, personal sacrifices, and children's tributes.
- **A Supportive Wife**: Her partnership, resilience, humor, and how she supports her spouse.

### 4. Family Video Links (Unlisted YouTube)
If family members recorded video greetings:
1. Upload the videos to [YouTube Studio](https://studio.youtube.com).
2. Set visibility to **"Unlisted"** (this means only people with the link or visiting this private site can watch; it will NOT appear in public YouTube search).
3. Copy the link and paste it into the **Video Embeds** tab in the Admin Studio!

---

## 🔐 Admin Studio & Access Passwords

- **Admin Studio URL**: Open [admin.html](file:///c:/Users/pc/OneDrive/Desktop/Mum%20Website/admin.html) or click the small key icon in the website footer.
- **Default Admin Password**: `mum2026` *(You can change this in Admin &rarr; Settings).*
- **Optional Family Passcode**: In Admin &rarr; Settings, you can enable a family passcode (e.g., `mumlove`) so only people who know the word can open the envelope.

---

## ☁️ Supabase Cloud Sync (Optional, Free)

By default, the website saves all changes instantly in your browser's local storage. If you want updates to sync automatically across all family devices:

1. Create a free account at [Supabase.com](https://supabase.com).
2. Create a new project (takes ~1 minute).
3. In your Supabase dashboard, click **SQL Editor**, and paste this snippet:
```sql
CREATE TABLE IF NOT EXISTS keepsake_data (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE keepsake_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read" ON keepsake_data FOR SELECT USING (true);
CREATE POLICY "Public Upsert" ON keepsake_data FOR ALL USING (true);
```
4. Click **Run**.
5. Go to **Project Settings &rarr; API** and copy:
   - **Project URL**
   - **anon / public key**
6. Open your website's **Admin Studio &rarr; Settings & Supabase**, paste the URL and Anon Key, and click **Save All Settings**.
7. That's it! Everything will now sync to the cloud in real-time.

---

## 🚀 How to Run Locally Right Now

You can open the website in two ways:

### Option A: Direct Open
Double-click [index.html](file:///c:/Users/pc/OneDrive/Desktop/Mum%20Website/index.html) in your file explorer to open it in your browser.

### Option B: Local Web Server (Recommended)
Open PowerShell in this folder and run:
```powershell
python -m http.server 8080
```
Then visit:
- **Tribute Website**: `http://localhost:8080/index.html`
- **Admin Studio**: `http://localhost:8080/admin.html`

---

## 🌐 How to Publish for Family to See (Free)

When you're ready to share it with Mum and family on December 23rd:
- **Netlify Drop** (Easiest, 30 seconds):
  Go to [app.netlify.com/drop](https://app.netlify.com/drop) and drag the entire `Mum Website` folder into the browser window. It will instantly give you a private, live web link!
- **Vercel** or **GitHub Pages**:
  You can also push this repository to GitHub and connect it to Vercel or Cloudflare Pages for a custom private domain.
