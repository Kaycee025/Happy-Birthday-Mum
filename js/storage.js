/**
 * Unified Keepsake Storage & Data Layer
 * Handles local persistence (localStorage / IndexedDB) and Supabase cloud sync.
 */

const DEFAULT_KEEPSAKE_DATA = {
  settings: {
    mumName: "Mum",
    birthdayDate: "December 23",
    familyPasscodeEnabled: false,
    familyPasscode: "mumlove",
    adminPassword: "mum2026",
    customAudioUrl: "",
    supabaseUrl: "",
    supabaseKey: ""
  },
  hero: {
    badge: "Keepsake Appreciation • December 23",
    scriptTag: "Happy Birthday to Our Dearest",
    heading: "Mum, You Are Our Heart & Home",
    writeup: "To the woman who gave us everything, whose gentle smile has been our steadfast compass, and whose infinite warmth has turned our lives into something miraculous. Today, on December 23rd, we celebrate you with all our hearts.",
    image: "assets/images/hero-mum.jpg"
  },
  sections: [
    {
      id: "best-mum",
      subtitle: "Unconditional Love",
      title: "The Best Mum in the World",
      narrative: "From our very first breath, you have enveloped us in a love that knows no bounds. You sacrificed your own comfort time and time again so that our dreams could take flight. In every quiet morning you spent preparing for us, and in every tender embrace when the world felt heavy, you taught us what genuine love feels like.",
      quote: "“A mother’s love is the quiet harbor where our souls always find peace.”",
      image: "assets/images/best-mum.jpg",
      stamp: "Endless Love"
    },
    {
      id: "supportive-wife",
      subtitle: "Devotion & Grace",
      title: "A Supportive Wife",
      narrative: "Happy birthday to my beautiful wife, my partner and the mother of our children. ❤️\n\nI am grateful to God for the woman you are and for the life we have built together. Watching you love and care for our family is something I never take for granted. You have been a wonderful wife, a loving mother, and a strong pillar of this family.\n\nThank you for standing by me, for all the sacrifices you make, and for the love you continue to give us every day. I pray that God blesses you with good health, peace, happiness and many more beautiful years.\n\nMay this new chapter bring you everything your heart desires. I love you, and I’m grateful to have you as my wife.\n\nHappy birthday, my love. ❤️",
      quote: "“May this new chapter bring you everything your heart desires. I love you, and I’m grateful to have you as my wife.”",
      image: "assets/supportive-wife/dad-photo-01.jpg",
      photos: [
        "assets/supportive-wife/dad-photo-01.jpg",
        "assets/supportive-wife/dad-photo-02.jpg"
      ],
      stamp: "Your Husband"
    }
  ],
  childrenTributes: [
    {
      id: "child-1-lolo",
      childIndex: 1,
      name: "Lolo (Ada Ukwuaziza)",
      role: "First Daughter",
      stamp: "Ada Ukwuaziza",
      narrative: "Dearest Mum, words cannot begin to capture the depth of my gratitude and love for you. You have been our pillar of strength, our comfort, and our greatest inspiration. Everything I am and aspire to be is because of your unwavering love and sacrifices.",
      quote: "“To the queen of our hearts, the woman whose grace guides us every day.”",
      photos: [
        "assets/first-daughter/lolo-photo-01.jpg",
        "assets/first-daughter/lolo-photo-02.jpg",
        "assets/first-daughter/lolo-photo-03.jpg",
        "assets/first-daughter/lolo-photo-04.jpg",
        "assets/first-daughter/lolo-photo-05.jpg",
        "assets/first-daughter/lolo-photo-06.jpg",
        "assets/first-daughter/lolo-photo-07.jpg",
        "assets/first-daughter/lolo-photo-08.jpg",
        "assets/first-daughter/lolo-photo-09.jpg",
        "assets/first-daughter/lolo-photo-10.jpg",
        "assets/first-daughter/lolo-photo-11.jpg",
        "assets/first-daughter/lolo-photo-12.jpg"
      ],
      videos: [
        "assets/first-daughter/lolo-video.mp4"
      ]
    },
    {
      id: "child-2-first-son",
      childIndex: 2,
      name: "Kenechukwu (Kenebom)",
      role: "First Son",
      stamp: "Kenechukwu (Kenebom)",
      narrative: "Happy birthday mum.\n\nYou have been so so supportive, caring and all I could ever wish for in a mum, on your special day all I wish is peace and good health.\n\nEveryday should be a special day for you ❤️",
      quote: "“Everyday should be a special day for you ❤️”",
      photos: [
        "assets/first-son/son-photo-01.jpg",
        "assets/first-son/son-photo-02.jpg",
        "assets/first-son/son-photo-03.jpg"
      ],
      videos: [
        "assets/first-son/son-video-01.mp4",
        "assets/first-son/son-video-02.mp4",
        "assets/first-son/son-video-03.mp4"
      ]
    },
    {
      id: "child-3-second-daughter",
      childIndex: 3,
      name: "Second Daughter",
      role: "Second Daughter",
      stamp: "Second Daughter",
      narrative: "One striking character you have is that you always support anyone, even when you don't understand exactly what they're doing. As far as it will make you happy and isn't evil, mummy will support you 100 %\n\nHappy birthday Mummy🥹\nThank you for all your sacrifices and ceaseless love.\nKeep basking in the beauty of the Lord.💙",
      quote: "“Thank you for all your sacrifices and ceaseless love. Keep basking in the beauty of the Lord.💙”",
      photos: [
        "assets/second-daughter/daughter2-photo-01.jpg"
      ],
      videos: []
    },
    {
      id: "child-4-second-son",
      childIndex: 4,
      name: "Second Son",
      role: "Second Son",
      stamp: "Second Son",
      narrative: "Happy birthday Mummy 🤭.\n\nWe thank God for adding 1 year to ur life and making you look younger as if he took ur years backwards\n\nEnjoy your day and don't enter kitchen today oo, Daddy will take care anything you need today\n\nMany more years to reap the fruit of ur labour",
      quote: "“Many more years to reap the fruit of ur labour”",
      photos: [
        "assets/second-son/son2-photo-01.jpg",
        "assets/second-son/son2-photo-02.jpg",
        "assets/second-son/son2-photo-03.jpg"
      ],
      videos: []
    },
    {
      id: "child-5-third-son",
      childIndex: 5,
      name: "Third Son",
      role: "Third Son",
      stamp: "Third Son",
      narrative: "Mummy, being the last born will always make me feel like I have a special place in your heart 😂❤️. Thank you for all the love, care, sacrifices, and prayers you’ve given me and the whole family.\n\nYou deserve all the love and happiness in the world.\n\nHappy birthday, Mummy. I love you so much ❤️🥹. May this new year of your life be filled with everything your heart desires.",
      quote: "“You deserve all the love and happiness in the world.”",
      photos: [
        "assets/third-son/son3-photo-01.jpg",
        "assets/third-son/son3-photo-02.jpg",
        "assets/third-son/son3-photo-03.jpg",
        "assets/third-son/son3-photo-04.jpg",
        "assets/third-son/son3-photo-05.jpg",
        "assets/third-son/son3-photo-06.jpg",
        "assets/third-son/son3-photo-07.jpg"
      ],
      videos: []
    }
  ],
  gallery: [
    {
      id: "gal-1",
      title: "Tending Her Garden of Roses",
      date: "Spring Morning",
      caption: "Mum arranging pastel blooms in the kitchen. Her patience with flowers mirrors the gentle care she has poured into each of us.",
      image: "assets/images/gallery-1.jpg",
      isNew: false
    },
    {
      id: "gal-2",
      title: "Surrounded by Love & Laughter",
      date: "Family Celebration",
      caption: "All of us gathered around the table, celebrating Mum's infectious laughter and radiant joy under warm candlelight.",
      image: "assets/images/gallery-2.jpg",
      isNew: false
    },
    {
      id: "gal-3",
      title: "Peaceful Coastal Walk",
      date: "Summer Holiday",
      caption: "Walking along the seaside with the ocean breeze in her hair and a serene smile on her face. Pure peace.",
      image: "assets/images/gallery-3.jpg",
      isNew: false
    },
    {
      id: "gal-4",
      title: "Sweet Little Moments",
      date: "Grandmother's Warmth",
      caption: "The tenderest embrace—sharing generational love and endless giggles on a sunny Sunday afternoon.",
      image: "assets/images/gallery-4.jpg",
      isNew: false
    }
  ],
  videos: [
    {
      id: "vid-1",
      title: "A Message of Love from Your Children",
      date: "December 2026",
      youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Unlisted placeholder link
      description: "A special compilation video of fond memories, childhood photos, and heartfelt voice messages we put together for your birthday."
    }
  ],
  wishes: []
};

class KeepsakeStorage {
  constructor() {
    this.storageKey = "mum_keepsake_site_data";
    this.supabaseClient = null;
    this.data = this.loadData();
    this.fetchFromServerApi();
    this.initSupabaseIfConfigured();
  }

  async fetchFromServerApi() {
    try {
      const res = await fetch('/api/content');
      if (res.ok) {
        const serverData = await res.json();
        if (serverData && typeof serverData === 'object') {
          this.data = {
            ...this.data,
            ...serverData,
            settings: { ...this.data.settings, ...(serverData.settings || {}) },
            hero: { ...this.data.hero, ...(serverData.hero || {}) }
          };
          localStorage.setItem(this.storageKey, JSON.stringify(this.data));
          window.dispatchEvent(new CustomEvent('keepsake:data-updated'));
        }
      }
    } catch (e) {
      // Offline or direct file preview - gracefully uses localStorage/defaults
    }
  }

  loadData() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure all keys exist
        return {
          ...DEFAULT_KEEPSAKE_DATA,
          ...parsed,
          settings: { ...DEFAULT_KEEPSAKE_DATA.settings, ...(parsed.settings || {}) },
          hero: { ...DEFAULT_KEEPSAKE_DATA.hero, ...(parsed.hero || {}) },
          childrenTributes: (parsed.childrenTributes && parsed.childrenTributes.length > 0) ? parsed.childrenTributes : DEFAULT_KEEPSAKE_DATA.childrenTributes
        };
      }
    } catch (e) {
      console.warn("Storage loading error:", e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_KEEPSAKE_DATA));
  }

  saveData(newData) {
    this.data = newData;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (e) {
      console.error("Local storage save error:", e);
    }
    this.syncToSupabase();
  }

  getData() {
    return this.data;
  }

  /* Supabase Cloud Sync Integration */
  initSupabaseIfConfigured() {
    const { supabaseUrl, supabaseKey } = this.data.settings;
    if (supabaseUrl && supabaseKey && window.supabase) {
      try {
        this.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
        this.fetchFromSupabase();
      } catch (e) {
        console.warn("Supabase init error:", e);
      }
    }
  }

  async fetchFromSupabase() {
    if (!this.supabaseClient) return;
    try {
      const { data, error } = await this.supabaseClient
        .from('keepsake_data')
        .select('*')
        .eq('id', 'primary')
        .single();
      
      if (data && data.payload) {
        this.data = { ...this.data, ...data.payload };
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        window.dispatchEvent(new CustomEvent('keepsake:data-updated'));
      }
    } catch (e) {
      console.warn("Supabase fetch error:", e);
    }
  }

  async syncToSupabase() {
    if (!this.supabaseClient) return;
    try {
      await this.supabaseClient
        .from('keepsake_data')
        .upsert({ id: 'primary', payload: this.data, updated_at: new Date().toISOString() });
    } catch (e) {
      console.warn("Supabase sync error:", e);
    }
  }

  /* Add Wish */
  addWish(wish) {
    const now = new Date();
    wish.id = wish.id || ('wish-' + Date.now());
    wish.time = wish.time || now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    wish.year = wish.year || now.getFullYear().toString();
    wish.date = wish.date || `${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • ${wish.time}`;
    if (!this.data.wishes) this.data.wishes = [];
    this.data.wishes.unshift(wish);
    this.saveData(this.data);
    return wish;
  }

  /* Add Gallery Image with 'isNew' Flag */
  addGalleryImage(item) {
    item.id = 'gal-' + Date.now();
    item.isNew = true;
    this.data.gallery.unshift(item);
    this.saveData(this.data);
    return item;
  }

  /* Add Video */
  addVideo(video) {
    video.id = 'vid-' + Date.now();
    this.data.videos.unshift(video);
    this.saveData(this.data);
    return video;
  }

  /* Delete Item */
  deleteGalleryItem(id) {
    this.data.gallery = this.data.gallery.filter(i => i.id !== id);
    this.saveData(this.data);
  }

  deleteVideo(id) {
    this.data.videos = this.data.videos.filter(v => v.id !== id);
    this.saveData(this.data);
  }

  deleteWish(id) {
    this.data.wishes = this.data.wishes.filter(w => w.id !== id);
    this.saveData(this.data);
  }
}

// Client-Side Image Compression Tool (compress to WebP/JPEG under ~300KB)
function compressImage(file, maxWidth = 1600, maxHeight = 1600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file.type.match(/image.*/)) {
      return reject(new Error("File is not an image"));
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to lightweight data URI WebP if supported, fallback to JPEG
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Extract YouTube Embed URL from any user provided format
function getYouTubeEmbedUrl(url) {
  if (!url) return '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://www.youtube-nocookie.com/embed/${match[2]}?rel=0&modestbranding=1`;
  }
  return url;
}

window.keepsakeStorage = new KeepsakeStorage();
window.compressImage = compressImage;
window.getYouTubeEmbedUrl = getYouTubeEmbedUrl;
