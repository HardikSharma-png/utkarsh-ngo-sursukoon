const { store, isDbReady, uid } = require('../utils/memStore');

let Settings, Sur_Sukoon_Event;
try { Settings = require('../models/Settings'); } catch (e) {}
try { Sur_Sukoon_Event = require('../models/Sur_Sukoon_Event'); } catch (e) {}

const DEFAULT_BANNERS = [
  {
    id: 'banner-1',
    imageUrl: '/images/banner-concert-1.jpg',
    headlineGold: 'Unleash Your Voice,',
    headlineWhite: 'Feel the Vibe!',
    subheading: "India's Ultimate Soulful Music Festival",
    description: 'Catch live performances, raw talent, and unforgettable musical evenings.',
    btn1Label: 'Register as Performer',
    btn1Link: '/register',
    btn2Label: 'Free Audience Entry',
    btn2Link: '/register?tab=audience',
    order: 1,
    isActive: true
  },
  {
    id: 'banner-2',
    imageUrl: '/images/banner-concert-2.jpg',
    headlineGold: 'Your Stage Awaits,',
    headlineWhite: 'Sing From The Heart!',
    subheading: 'Where Every Voice Finds Its Spotlight',
    description: 'Open to classical, semi-classical, Bollywood, folk & ghazal singers across Rajasthan.',
    btn1Label: 'Register as Performer',
    btn1Link: '/register',
    btn2Label: 'Free Audience Entry',
    btn2Link: '/register?tab=audience',
    order: 2,
    isActive: true
  },
  {
    id: 'banner-3',
    imageUrl: '/images/banner-concert-3.jpg',
    headlineGold: 'An Evening of Melody,',
    headlineWhite: 'Pure Soulful Magic!',
    subheading: 'Presented by Utkarsh Samajik Seva Sansthan',
    description: 'Join passionate artists and a warm community audience for a memorable cultural night.',
    btn1Label: 'Register as Performer',
    btn1Link: '/register',
    btn2Label: 'Free Audience Entry',
    btn2Link: '/register?tab=audience',
    order: 3,
    isActive: true
  }
];

const DEFAULT_HIGHLIGHTS = [
  {
    id: 'hl-1',
    title: 'Sur-Sukoon — Live Stage Performances',
    subtitle: 'Sur-Sukoon Official',
    youtubeUrl: 'https://www.youtube.com/watch?v=ti8tyqmX91Q',
    order: 1
  },
  {
    id: 'hl-2',
    title: 'Soulful Musical Evening — Highlights',
    subtitle: 'Utkarsh Presents',
    youtubeUrl: 'https://www.youtube.com/watch?v=hJN2lXlFdKU',
    order: 2
  },
  {
    id: 'hl-3',
    title: 'Acoustic & Classical Vocalists Live',
    subtitle: 'Jaipur Stage',
    youtubeUrl: 'https://www.youtube.com/watch?v=fGv4ATukcX4',
    order: 3
  },
  {
    id: 'hl-4',
    title: 'Grand Audience & Stage Moments',
    subtitle: 'Sur-Sukoon Memories',
    youtubeUrl: 'https://www.youtube.com/watch?v=ti8tyqmX91Q',
    order: 4
  }
];

const DEFAULT_HERO_VIDEO = {
  url: '',
  type: 'youtube', // 'youtube' or 'upload'
  autoplay: true,
  muted: true,
  loop: true
};

// ─── SETTINGS PERSISTENCE HELPERS ──────────────────────────────

async function getSetting(key, defaultValue) {
  try {
    if (isDbReady() && Settings) {
      const doc = await Settings.findOne({ key });
      if (doc && doc.value !== undefined && doc.value !== null) {
        store.settings[key] = doc.value;
        return doc.value;
      }
    }
  } catch (e) {}

  if (store.settings[key] !== undefined && store.settings[key] !== null) {
    return store.settings[key];
  }
  return defaultValue;
}

async function saveSetting(key, value) {
  store.settings[key] = value;
  if (isDbReady() && Settings) {
    await Settings.findOneAndUpdate(
      { key },
      { key, value },
      { upsert: true, new: true }
    );
  }
}

async function getActiveEventPromoVideo() {
  try {
    if (isDbReady() && Sur_Sukoon_Event) {
      const event = await Sur_Sukoon_Event.findOne({ status: 'upcoming' }).sort({ date: 1 });
      if (event && event.promoVideoUrl) return event.promoVideoUrl.trim();
    }
  } catch (e) {}

  const memEvent = (store.ssEvents || []).find(e => e.status === 'upcoming');
  if (memEvent && memEvent.promoVideoUrl) return memEvent.promoVideoUrl.trim();
  return '';
}

function detectVideoType(url) {
  if (!url) return 'youtube';
  const clean = url.trim().toLowerCase();
  if (clean.includes('youtube.com') || clean.includes('youtu.be')) return 'youtube';
  if (clean.endsWith('.mp4') || clean.endsWith('.webm') || clean.endsWith('.mov') || clean.startsWith('/uploads/')) return 'upload';
  return 'youtube';
}

function extractYouTubeId(url) {
  if (!url) return '';
  const m = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|v\/|embed\/|shorts\/))([^&\n?#]+)/);
  return m ? m[1] : '';
}

// ─── PUBLIC CONTROLLER ─────────────────────────────────────────

const getHomepageConfig = async (req, res) => {
  try {
    const heroVideoSetting = await getSetting('homepageHeroVideo', DEFAULT_HERO_VIDEO);
    const bannersSetting = await getSetting('homepageBanners', DEFAULT_BANNERS);
    const highlightsSetting = await getSetting('homepageHighlights', DEFAULT_HIGHLIGHTS);

    const activeEventPromo = await getActiveEventPromoVideo();

    const heroVideo = {
      url: heroVideoSetting?.url || '',
      type: heroVideoSetting?.type || (heroVideoSetting?.url ? detectVideoType(heroVideoSetting.url) : 'youtube'),
      autoplay: true,
      muted: true,
      loop: true,
      isFallback: false,
      effectiveUrl: ''
    };

    if (heroVideo.url) {
      heroVideo.effectiveUrl = heroVideo.url;
      heroVideo.type = heroVideo.type || detectVideoType(heroVideo.url);
    } else if (activeEventPromo) {
      heroVideo.effectiveUrl = activeEventPromo;
      heroVideo.type = detectVideoType(activeEventPromo);
      heroVideo.isFallback = true;
    } else {
      heroVideo.effectiveUrl = '';
      heroVideo.isFallback = true;
    }

    const banners = (Array.isArray(bannersSetting) ? bannersSetting : DEFAULT_BANNERS)
      .filter(b => b && b.isActive !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    const highlights = (Array.isArray(highlightsSetting) ? highlightsSetting : DEFAULT_HIGHLIGHTS)
      .map(h => {
        const ytId = extractYouTubeId(h.youtubeUrl);
        return {
          ...h,
          videoId: ytId,
          thumbnailUrl: ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : (h.thumbnailUrl || '/images/hero-stage-thumb.jpg')
        };
      })
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    res.json({
      success: true,
      data: {
        heroVideo,
        banners,
        highlights,
        activeEventPromo
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── ADMIN HERO VIDEO CONTROLLERS ──────────────────────────────

const updateHeroVideo = async (req, res) => {
  try {
    let videoUrl = '';
    let videoType = 'youtube';

    if (req.file) {
      videoUrl = req.file.buffer
        ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`
        : `/uploads/${req.file.filename}`;
      videoType = 'upload';
    } else if (req.body.clear === 'true' || req.body.clear === true) {
      videoUrl = '';
      videoType = 'youtube';
    } else {
      videoUrl = String(req.body.url || '').trim();
      videoType = req.body.type || detectVideoType(videoUrl);
    }

    const updated = {
      url: videoUrl,
      type: videoType,
      autoplay: true,
      muted: true,
      loop: true,
      updatedAt: new Date().toISOString()
    };

    await saveSetting('homepageHeroVideo', updated);

    const activeEventPromo = await getActiveEventPromoVideo();

    res.json({
      success: true,
      message: videoUrl ? 'Hero video updated successfully!' : 'Hero video reset to event fallback.',
      data: {
        ...updated,
        effectiveUrl: videoUrl || activeEventPromo || '',
        isFallback: !videoUrl
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── ADMIN BANNERS CONTROLLERS ─────────────────────────────────

const addBanner = async (req, res) => {
  try {
    const banners = await getSetting('homepageBanners', DEFAULT_BANNERS);

    let imageUrl = '';
    if (req.file) {
      imageUrl = req.file.buffer
        ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`
        : `/uploads/${req.file.filename}`;
    } else if (req.body.imageUrl) {
      imageUrl = String(req.body.imageUrl).trim();
    }

    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'Banner image is required (upload a file or provide an image URL).' });
    }

    const newBanner = {
      id: `banner-${Date.now()}`,
      imageUrl,
      headlineGold: String(req.body.headlineGold || '').trim(),
      headlineWhite: String(req.body.headlineWhite || '').trim(),
      headline: String(req.body.headline || '').trim(),
      subheading: String(req.body.subheading || '').trim(),
      description: String(req.body.description || '').trim(),
      btn1Label: String(req.body.btn1Label || '').trim(),
      btn1Link: String(req.body.btn1Link || '').trim(),
      btn2Label: String(req.body.btn2Label || '').trim(),
      btn2Link: String(req.body.btn2Link || '').trim(),
      order: parseInt(req.body.order, 10) || (banners.length + 1),
      isActive: true,
      createdAt: new Date().toISOString()
    };

    banners.push(newBanner);
    await saveSetting('homepageBanners', banners);

    res.json({
      success: true,
      message: 'Banner added successfully!',
      data: newBanner
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const banners = await getSetting('homepageBanners', DEFAULT_BANNERS);
    const index = banners.findIndex(b => b.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Banner not found.' });
    }

    let imageUrl = banners[index].imageUrl;
    if (req.file) {
      imageUrl = req.file.buffer
        ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`
        : `/uploads/${req.file.filename}`;
    } else if (req.body.imageUrl) {
      imageUrl = String(req.body.imageUrl).trim();
    }

    banners[index] = {
      ...banners[index],
      imageUrl,
      headlineGold: req.body.headlineGold !== undefined ? String(req.body.headlineGold).trim() : banners[index].headlineGold,
      headlineWhite: req.body.headlineWhite !== undefined ? String(req.body.headlineWhite).trim() : banners[index].headlineWhite,
      headline: req.body.headline !== undefined ? String(req.body.headline).trim() : banners[index].headline,
      subheading: req.body.subheading !== undefined ? String(req.body.subheading).trim() : banners[index].subheading,
      description: req.body.description !== undefined ? String(req.body.description).trim() : banners[index].description,
      btn1Label: req.body.btn1Label !== undefined ? String(req.body.btn1Label).trim() : banners[index].btn1Label,
      btn1Link: req.body.btn1Link !== undefined ? String(req.body.btn1Link).trim() : banners[index].btn1Link,
      btn2Label: req.body.btn2Label !== undefined ? String(req.body.btn2Label).trim() : banners[index].btn2Label,
      btn2Link: req.body.btn2Link !== undefined ? String(req.body.btn2Link).trim() : banners[index].btn2Link,
      order: req.body.order !== undefined ? parseInt(req.body.order, 10) : banners[index].order,
      isActive: req.body.isActive !== undefined ? Boolean(req.body.isActive) : banners[index].isActive,
      updatedAt: new Date().toISOString()
    };

    await saveSetting('homepageBanners', banners);

    res.json({
      success: true,
      message: 'Banner updated successfully!',
      data: banners[index]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    let banners = await getSetting('homepageBanners', DEFAULT_BANNERS);
    const initialLen = banners.length;
    banners = banners.filter(b => b.id !== id);

    if (banners.length === initialLen) {
      return res.status(404).json({ success: false, message: 'Banner not found.' });
    }

    // Re-index remaining order values
    banners.forEach((b, i) => { b.order = i + 1; });
    await saveSetting('homepageBanners', banners);

    res.json({ success: true, message: 'Banner deleted successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const reorderBanners = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
      return res.status(400).json({ success: false, message: 'Invalid payload: ids array is required.' });
    }

    const banners = await getSetting('homepageBanners', DEFAULT_BANNERS);
    const map = new Map(banners.map(b => [b.id, b]));

    const reordered = [];
    ids.forEach((id, idx) => {
      if (map.has(id)) {
        const item = map.get(id);
        item.order = idx + 1;
        reordered.push(item);
        map.delete(id);
      }
    });

    // Append any remaining banners not in ids array
    for (const remaining of map.values()) {
      remaining.order = reordered.length + 1;
      reordered.push(remaining);
    }

    await saveSetting('homepageBanners', reordered);
    res.json({ success: true, message: 'Banners reordered successfully!', data: reordered });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── ADMIN HIGHLIGHTS CONTROLLERS ──────────────────────────────

const addHighlight = async (req, res) => {
  try {
    const highlights = await getSetting('homepageHighlights', DEFAULT_HIGHLIGHTS);
    const title = String(req.body.title || '').trim();
    const subtitle = String(req.body.subtitle || '').trim();
    const youtubeUrl = String(req.body.youtubeUrl || '').trim();

    if (!title) {
      return res.status(400).json({ success: false, message: 'Highlight Video Title is required.' });
    }
    if (!youtubeUrl) {
      return res.status(400).json({ success: false, message: 'YouTube Video URL is required.' });
    }

    const ytId = extractYouTubeId(youtubeUrl);
    const newHighlight = {
      id: `hl-${Date.now()}`,
      title,
      subtitle: subtitle || 'Sur-Sukoon Live',
      youtubeUrl,
      videoId: ytId,
      thumbnailUrl: ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '/images/hero-stage-thumb.jpg',
      order: parseInt(req.body.order, 10) || (highlights.length + 1),
      createdAt: new Date().toISOString()
    };

    highlights.push(newHighlight);
    await saveSetting('homepageHighlights', highlights);

    res.json({
      success: true,
      message: 'Highlight video added successfully!',
      data: newHighlight
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateHighlight = async (req, res) => {
  try {
    const { id } = req.params;
    const highlights = await getSetting('homepageHighlights', DEFAULT_HIGHLIGHTS);
    const index = highlights.findIndex(h => h.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Highlight video not found.' });
    }

    const title = req.body.title !== undefined ? String(req.body.title).trim() : highlights[index].title;
    const subtitle = req.body.subtitle !== undefined ? String(req.body.subtitle).trim() : highlights[index].subtitle;
    const youtubeUrl = req.body.youtubeUrl !== undefined ? String(req.body.youtubeUrl).trim() : highlights[index].youtubeUrl;
    const ytId = extractYouTubeId(youtubeUrl);

    highlights[index] = {
      ...highlights[index],
      title: title || highlights[index].title,
      subtitle: subtitle || highlights[index].subtitle,
      youtubeUrl: youtubeUrl || highlights[index].youtubeUrl,
      videoId: ytId,
      thumbnailUrl: ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : highlights[index].thumbnailUrl,
      order: req.body.order !== undefined ? parseInt(req.body.order, 10) : highlights[index].order,
      updatedAt: new Date().toISOString()
    };

    await saveSetting('homepageHighlights', highlights);

    res.json({
      success: true,
      message: 'Highlight video updated successfully!',
      data: highlights[index]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteHighlight = async (req, res) => {
  try {
    const { id } = req.params;
    let highlights = await getSetting('homepageHighlights', DEFAULT_HIGHLIGHTS);
    const initialLen = highlights.length;
    highlights = highlights.filter(h => h.id !== id);

    if (highlights.length === initialLen) {
      return res.status(404).json({ success: false, message: 'Highlight video not found.' });
    }

    highlights.forEach((h, i) => { h.order = i + 1; });
    await saveSetting('homepageHighlights', highlights);

    res.json({ success: true, message: 'Highlight video deleted successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const reorderHighlights = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
      return res.status(400).json({ success: false, message: 'Invalid payload: ids array is required.' });
    }

    const highlights = await getSetting('homepageHighlights', DEFAULT_HIGHLIGHTS);
    const map = new Map(highlights.map(h => [h.id, h]));

    const reordered = [];
    ids.forEach((id, idx) => {
      if (map.has(id)) {
        const item = map.get(id);
        item.order = idx + 1;
        reordered.push(item);
        map.delete(id);
      }
    });

    for (const remaining of map.values()) {
      remaining.order = reordered.length + 1;
      reordered.push(remaining);
    }

    await saveSetting('homepageHighlights', reordered);
    res.json({ success: true, message: 'Highlights reordered successfully!', data: reordered });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getHomepageConfig,
  updateHeroVideo,
  addBanner,
  updateBanner,
  deleteBanner,
  reorderBanners,
  addHighlight,
  updateHighlight,
  deleteHighlight,
  reorderHighlights
};

