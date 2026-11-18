const { store, isDbReady } = require('../utils/memStore');

let Settings, Media;
try { Settings = require('../models/Settings'); } catch (e) {}
try { Media = require('../models/Media'); } catch (e) {}

// 12-minute in-memory cache TTL (within requested 10-15 min window)
const CACHE_TTL_MS = 12 * 60 * 1000;

const galleryCache = {
  photos: { url: '', data: null, fetchedAt: 0, error: null },
  videos: { url: '', data: null, fetchedAt: 0, error: null }
};

function clearGalleryCache() {
  galleryCache.photos = { url: '', data: null, fetchedAt: 0, error: null };
  galleryCache.videos = { url: '', data: null, fetchedAt: 0, error: null };
}

function isCacheFresh(bucket, currentUrl) {
  return (
    bucket.data !== null &&
    bucket.url === currentUrl &&
    Date.now() - bucket.fetchedAt < CACHE_TTL_MS
  );
}

// ─── SETTINGS HELPERS ───────────────────────────────────────────

async function getSettingValue(key) {
  try {
    if (isDbReady() && Settings) {
      const doc = await Settings.findOne({ key });
      if (doc && doc.value !== undefined && doc.value !== null) {
        store.settings[key] = doc.value;
        return doc.value;
      }
    }
  } catch (e) {}
  return store.settings[key] || '';
}

async function saveSettingValue(key, value) {
  store.settings[key] = value;
  if (isDbReady() && Settings) {
    await Settings.findOneAndUpdate(
      { key },
      { key, value },
      { upsert: true, new: true }
    );
  }
}

// ─── UTILITY HELPERS ────────────────────────────────────────────

function decodeXmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
    .trim();
}

function formatSeconds(totalSeconds) {
  const sec = parseInt(totalSeconds, 10);
  if (!sec || isNaN(sec) || sec <= 0) return '';
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const rem = sec % 60;
  const pad = n => String(n).padStart(2, '0');
  return hrs > 0 ? `${hrs}:${pad(mins)}:${pad(rem)}` : `${mins}:${pad(rem)}`;
}

// ─── GOOGLE PHOTOS SCRAPER (Full AF_initDataCallback Extraction) ───

function isAllowedGooglePhotosUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
    const host = u.hostname.toLowerCase();
    return (
      host === 'photos.app.goo.gl' ||
      host === 'photos.google.com' ||
      host === 'goo.gl'
    );
  } catch {
    return false;
  }
}

function isExcludedPhotoUrl(url) {
  if (!url) return true;
  const lower = url.toLowerCase();
  // Discard user avatars, profile pictures, UI icons, proxy thumbnails
  if (
    lower.includes('/a/') ||
    lower.includes('/a-/') ||
    lower.includes('/ogw/') ||
    lower.includes('/cm/') ||
    lower.includes('/proxy/') ||
    lower.includes('default-user') ||
    lower.includes('=s32') ||
    lower.includes('=s48') ||
    lower.includes('=s64') ||
    lower.includes('=s96') ||
    lower.includes('=w32') ||
    lower.includes('=w48') ||
    lower.includes('=w64')
  ) {
    return true;
  }
  const base = url.replace(/=[^"'\s\\<>]*$/, '');
  // Album photos always have long opaque Google Photos tokens (>= 50 chars total)
  return base.length < 50;
}

/**
 * Extracts and parses all AF_initDataCallback JSON payloads from Google Photos HTML.
 * Uses exact brace matching so nested objects and string literals with curly braces
 * are preserved without early truncation.
 */
function extractAllAFInitData(html) {
  const marker = 'AF_initDataCallback(';
  const results = [];
  let pos = 0;

  while ((pos = html.indexOf(marker, pos)) !== -1) {
    const callStart = pos + marker.length;
    const openBrace = html.indexOf('{', callStart);
    if (openBrace === -1 || openBrace - callStart > 60) {
      pos = callStart;
      continue;
    }

    let depth = 0;
    let inString = false;
    let quoteChar = '';
    let escape = false;
    let endBrace = -1;

    for (let i = openBrace; i < html.length; i++) {
      const ch = html[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === '\\') {
        escape = true;
        continue;
      }
      if (inString) {
        if (ch === quoteChar) {
          inString = false;
        }
        continue;
      }
      if (ch === '"' || ch === "'") {
        inString = true;
        quoteChar = ch;
        continue;
      }
      if (ch === '{') {
        depth++;
      } else if (ch === '}') {
        depth--;
        if (depth === 0) {
          endBrace = i;
          break;
        }
      }
    }

    if (endBrace !== -1) {
      const jsonStr = html.slice(openBrace, endBrace + 1);
      try {
        const parsed = JSON.parse(jsonStr);
        if (parsed) results.push(parsed);
      } catch {
        try {
          const fn = new Function(`return (${jsonStr});`);
          const evaluated = fn();
          if (evaluated) results.push(evaluated);
        } catch {}
      }
      pos = endBrace + 1;
    } else {
      pos = callStart;
    }
  }

  return results;
}

async function scrapeGooglePhotosAlbum(albumUrl) {
  if (!isAllowedGooglePhotosUrl(albumUrl)) {
    throw new Error('Invalid Google Photos album link. Use a public photos.app.goo.gl or photos.google.com/share/... URL.');
  }

  const res = await fetch(albumUrl, {
    redirect: 'follow',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9'
    },
    signal: AbortSignal.timeout(18000)
  });

  if (!res.ok) {
    throw new Error(`Google Photos returned HTTP ${res.status}. Ensure the album link is publicly shared.`);
  }

  const html = await res.text();
  const seen = new Map();

  // Primary Pass: Parse full AF_initDataCallback payloads without truncation
  const callbacks = extractAllAFInitData(html);
  for (const cb of callbacks) {
    const data = cb && cb.data;
    if (!data) continue;

    function walk(node) {
      if (!node || typeof node !== 'object') return;

      if (Array.isArray(node)) {
        // Pattern A: [ "https://lh3.googleusercontent.com/...", width, height ]
        if (
          typeof node[0] === 'string' &&
          node[0].startsWith('https://lh3.googleusercontent.com/')
        ) {
          const rawUrl = node[0];
          if (!isExcludedPhotoUrl(rawUrl)) {
            const baseUrl = rawUrl.replace(/=[^"'\s\\<>]*$/, '');
            const w = typeof node[1] === 'number' && node[1] >= 150 ? node[1] : null;
            const h = typeof node[2] === 'number' && node[2] >= 150 ? node[2] : null;
            if (!seen.has(baseUrl)) {
              seen.set(baseUrl, { baseUrl, width: w, height: h });
            }
          }
        }

        // Pattern B: Inspect array elements for embedded lh3 image URLs
        for (let i = 0; i < node.length; i++) {
          const item = node[i];
          if (typeof item === 'string' && item.startsWith('https://lh3.googleusercontent.com/')) {
            if (!isExcludedPhotoUrl(item)) {
              const baseUrl = item.replace(/=[^"'\s\\<>]*$/, '');
              if (!seen.has(baseUrl)) {
                const w = typeof node[i + 1] === 'number' && node[i + 1] >= 150 ? node[i + 1] : null;
                const h = typeof node[i + 2] === 'number' && node[i + 2] >= 150 ? node[i + 2] : null;
                seen.set(baseUrl, { baseUrl, width: w, height: h });
              }
            }
          } else if (typeof item === 'object' && item !== null) {
            walk(item);
          }
        }
      } else {
        for (const k of Object.keys(node)) {
          walk(node[k]);
        }
      }
    }

    walk(data);
  }

  // Fallback Pass 1: Tuple regex with explicit dimensions if AF_initDataCallback found nothing
  if (seen.size === 0) {
    const tupleRegex = /\["(https:\/\/lh3\.googleusercontent\.com\/(?:pw\/)?[A-Za-z0-9_-]{35,})(?:=[^"\\]*)?",\s*(\d{3,5}),\s*(\d{3,5})/g;
    let m;
    while ((m = tupleRegex.exec(html)) !== null) {
      const baseUrl = m[1];
      const width = parseInt(m[2], 10);
      const height = parseInt(m[3], 10);
      if (isExcludedPhotoUrl(baseUrl)) continue;
      if (width < 150 || height < 150) continue;
      if (!seen.has(baseUrl)) {
        seen.set(baseUrl, { baseUrl, width, height });
      }
    }
  }

  // Fallback Pass 2: Pattern matching specifically for /pw/ album images
  if (seen.size === 0) {
    const pwRegex = /https:\/\/lh3\.googleusercontent\.com\/pw\/[A-Za-z0-9_-]{30,}(?:=[^"'\s\\<>]*)?/g;
    let m;
    while ((m = pwRegex.exec(html)) !== null) {
      const raw = m[0];
      if (isExcludedPhotoUrl(raw)) continue;
      const baseUrl = raw.replace(/=[^"'\s\\<>]*$/, '');
      if (!seen.has(baseUrl)) {
        seen.set(baseUrl, { baseUrl, width: null, height: null });
      }
    }
  }

  // Fallback Pass 3: Generic long lh3.googleusercontent.com photo fallback (excluding avatars)
  if (seen.size === 0) {
    const genericRegex = /https:\/\/lh3\.googleusercontent\.com\/[A-Za-z0-9_-]{50,}(?:=[^"'\s\\<>]*)?/g;
    let m;
    while ((m = genericRegex.exec(html)) !== null) {
      const raw = m[0];
      if (isExcludedPhotoUrl(raw)) continue;
      const baseUrl = raw.replace(/=[^"'\s\\<>]*$/, '');
      if (!seen.has(baseUrl)) {
        seen.set(baseUrl, { baseUrl, width: null, height: null });
      }
    }
  }

  const photos = [];
  let idx = 1;
  // NO .slice() — returning ALL photos from the Google Photos album
  for (const entry of seen.values()) {
    photos.push({
      id: `gp-${idx}`,
      thumbUrl: `${entry.baseUrl}=w800`,
      fullUrl: `${entry.baseUrl}=w1600`,
      url: `${entry.baseUrl}=w800`,
      width: entry.width,
      height: entry.height,
      title: `Sur-Sukoon Moment ${idx}`
    });
    idx++;
  }

  return photos;
}

// ─── YOUTUBE PLAYLIST FULL SCRAPER (No 15-Video Cap) ─────────────

function extractYouTubePlaylistId(input) {
  if (!input) return '';
  const trimmed = String(input).trim();
  try {
    const u = new URL(trimmed);
    const listParam = u.searchParams.get('list');
    if (listParam && /^[A-Za-z0-9_-]{8,}$/.test(listParam)) {
      return listParam;
    }
  } catch {}
  const match = trimmed.match(/[?&]list=([A-Za-z0-9_-]{8,})/);
  if (match) return match[1];
  if (/^(PL|UU|OLAK|RD|FL|LL)[A-Za-z0-9_-]{6,}$/.test(trimmed)) {
    return trimmed;
  }
  return '';
}

function extractYouTubeVideoId(url) {
  if (!url) return '';
  const match = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|v\/|embed\/|shorts\/))([^&\n?#]+)/);
  return match ? match[1] : '';
}

/**
 * Extracts video items from both modern YouTube lockupViewModel and classic playlistVideoRenderer
 */
function parseYouTubeVideoItem(item) {
  if (!item || typeof item !== 'object') return null;

  // Modern YouTube 2024–2026 UI architecture
  if (item.lockupViewModel) {
    const vm = item.lockupViewModel;
    const videoId = vm.contentId || '';
    if (!videoId) return null;

    let title = '';
    if (vm.metadata?.lockupMetadataViewModel?.title?.content) {
      title = vm.metadata.lockupMetadataViewModel.title.content;
    } else if (vm.rendererContext?.accessibilityContext?.label) {
      title = vm.rendererContext.accessibilityContext.label;
    }

    let duration = '';
    const overlays = vm.contentImage?.thumbnailViewModel?.overlays || [];
    for (const ov of overlays) {
      const badges = ov.thumbnailBottomOverlayViewModel?.badges || [];
      if (badges.length > 0 && badges[0].thumbnailBadgeViewModel?.text) {
        duration = badges[0].thumbnailBadgeViewModel.text;
        break;
      }
    }

    let author = 'Sur-Sukoon';
    const rows = vm.metadata?.lockupMetadataViewModel?.metadata?.contentMetadataViewModel?.metadataRows || [];
    if (rows[0]?.metadataParts?.[0]?.text?.content) {
      author = rows[0].metadataParts[0].text.content;
    }

    const thumbSources = vm.contentImage?.thumbnailViewModel?.image?.sources || [];
    const bestThumb = thumbSources.slice(-1)[0]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    return {
      videoId,
      title: title || 'Sur-Sukoon Performance',
      author,
      thumbnailUrl: bestThumb,
      duration,
      url: `https://www.youtube.com/watch?v=${videoId}`
    };
  }

  // Classic YouTube playlistVideoRenderer architecture
  if (item.playlistVideoRenderer) {
    const v = item.playlistVideoRenderer;
    const videoId = v.videoId;
    if (!videoId) return null;

    const title = v.title?.runs?.[0]?.text || v.title?.simpleText || 'Sur-Sukoon Performance';
    const duration = v.lengthText?.simpleText || (v.lengthSeconds ? formatSeconds(v.lengthSeconds) : '');
    const author = v.shortBylineText?.runs?.[0]?.text || 'Sur-Sukoon';
    const bestThumb = v.thumbnail?.thumbnails?.slice(-1)[0]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    return {
      videoId,
      title,
      author,
      thumbnailUrl: bestThumb,
      duration,
      url: `https://www.youtube.com/watch?v=${videoId}`
    };
  }

  return null;
}

/**
 * Extracts continuation token from either continuationItemViewModel or continuationItemRenderer
 */
function extractContinuationToken(item) {
  if (!item || typeof item !== 'object') return null;
  if (item.continuationItemViewModel) {
    return (
      item.continuationItemViewModel.continuationCommand?.innertubeCommand?.continuationCommand?.token ||
      item.continuationItemViewModel.continuationCommand?.token ||
      null
    );
  }
  if (item.continuationItemRenderer) {
    return (
      item.continuationItemRenderer.continuationEndpoint?.continuationCommand?.token ||
      item.continuationItemRenderer.continuationEndpoint?.token ||
      null
    );
  }
  return null;
}

/**
 * Fallback to RSS feed if initial data scraping fails for any reason
 */
async function fetchYouTubePlaylistVideosRSS(playlistId) {
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${encodeURIComponent(playlistId)}`;
  const res = await fetch(rssUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; SurSukoonGallery/1.0)',
      'Accept': 'application/atom+xml, application/xml, text/xml;q=0.9'
    },
    signal: AbortSignal.timeout(12000)
  });

  if (!res.ok) {
    throw new Error(`YouTube returned HTTP ${res.status}. Ensure playlist is Public or Unlisted.`);
  }

  const xml = await res.text();
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];
  const videos = [];

  for (const entry of entries) {
    const idMatch = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
    const videoId = idMatch ? idMatch[1].trim() : '';
    if (!videoId) continue;

    const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
    const title = titleMatch ? decodeXmlEntities(titleMatch[1]) : 'Sur-Sukoon Performance';

    const authorMatch = entry.match(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>/);
    const author = authorMatch ? decodeXmlEntities(authorMatch[1]) : 'Sur-Sukoon';

    const thumbMatch = entry.match(/<media:thumbnail[^>]*url="([^"]+)"/);
    const thumbnailUrl = thumbMatch ? decodeXmlEntities(thumbMatch[1]) : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    const durMatch = entry.match(/<yt:duration[^>]*seconds="(\d+)"/);
    const duration = durMatch ? formatSeconds(durMatch[1]) : '';

    videos.push({
      videoId,
      title,
      author,
      thumbnailUrl,
      duration,
      url: `https://www.youtube.com/watch?v=${videoId}`
    });
  }

  return videos;
}

/**
 * Fetches ALL videos from a YouTube playlist using full ytInitialData + innertube continuation scraping.
 * Removes the 15-video RSS limit and collects every single video in the playlist without API key requirements.
 */
async function fetchYouTubePlaylistVideos(playlistUrl) {
  const playlistId = extractYouTubePlaylistId(playlistUrl);
  if (!playlistId) {
    throw new Error('Could not extract a valid YouTube playlist ID from the provided URL.');
  }

  const pageUrl = `https://www.youtube.com/playlist?list=${encodeURIComponent(playlistId)}`;
  let html = '';
  try {
    const pageRes = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      signal: AbortSignal.timeout(18000)
    });

    if (!pageRes.ok) {
      throw new Error(`YouTube playlist page returned HTTP ${pageRes.status}`);
    }
    html = await pageRes.text();
  } catch (err) {
    // If page request fails, fallback to RSS
    const rssVideos = await fetchYouTubePlaylistVideosRSS(playlistId);
    return { playlistId, videos: rssVideos, source: 'youtube-rss-fallback' };
  }

  // Extract INNERTUBE client configuration for continuation requests
  const apiKeyMatch = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/);
  const clientVersionMatch = html.match(/"INNERTUBE_CLIENT_VERSION":"([^"]+)"/);
  const apiKey = apiKeyMatch ? apiKeyMatch[1] : '';
  const clientVer = clientVersionMatch ? clientVersionMatch[1] : '2.20240601.00.00';

  // Extract ytInitialData JSON
  let ytInitialData = null;
  const initMatch = html.match(/ytInitialData\s*=\s*(\{.+?\});<\/script>/s) || html.match(/ytInitialData\s*=\s*(\{.+?\});/);
  if (initMatch) {
    try {
      ytInitialData = JSON.parse(initMatch[1]);
    } catch {}
  }

  if (!ytInitialData) {
    const marker = 'var ytInitialData = ';
    const start = html.indexOf(marker);
    if (start !== -1) {
      const jsonStart = start + marker.length;
      let depth = 0;
      let inString = false;
      let escape = false;
      let end = -1;
      for (let i = jsonStart; i < html.length; i++) {
        const ch = html[i];
        if (escape) { escape = false; continue; }
        if (ch === '\\') { escape = true; continue; }
        if (ch === '"') { inString = !inString; continue; }
        if (!inString) {
          if (ch === '{') depth++;
          else if (ch === '}') {
            depth--;
            if (depth === 0) { end = i + 1; break; }
          }
        }
      }
      if (end !== -1) {
        try {
          ytInitialData = JSON.parse(html.slice(jsonStart, end));
        } catch {}
      }
    }
  }

  // If ytInitialData extraction failed completely, fallback to RSS
  if (!ytInitialData) {
    const rssVideos = await fetchYouTubePlaylistVideosRSS(playlistId);
    return { playlistId, videos: rssVideos, source: 'youtube-rss-fallback' };
  }

  const videosMap = new Map();
  let continuationToken = null;

  // Traverse initial page items
  function walkInitial(node) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      let arrayVideos = 0;
      let arrayToken = null;
      for (const el of node) {
        const v = parseYouTubeVideoItem(el);
        if (v && v.videoId) {
          arrayVideos++;
          if (!videosMap.has(v.videoId)) videosMap.set(v.videoId, v);
        }
        const tok = extractContinuationToken(el);
        if (tok) arrayToken = tok;
        if (!v && !tok) walkInitial(el);
      }
      if (arrayVideos > 0 && arrayToken) {
        continuationToken = arrayToken;
      }
    } else {
      for (const k of Object.keys(node)) {
        walkInitial(node[k]);
      }
    }
  }

  walkInitial(ytInitialData);

  // If initial page found videos, follow continuation tokens to fetch ALL remaining pages
  let safetyIteration = 0;
  while (continuationToken && apiKey && safetyIteration < 25) {
    safetyIteration++;
    let nextContToken = null;

    try {
      const contUrl = `https://www.youtube.com/youtubei/v1/browse?key=${encodeURIComponent(apiKey)}&prettyPrint=false`;
      const contRes = await fetch(contUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'X-Youtube-Client-Name': '1',
          'X-Youtube-Client-Version': clientVer,
          'Origin': 'https://www.youtube.com',
          'Referer': pageUrl
        },
        body: JSON.stringify({
          context: {
            client: {
              hl: 'en',
              gl: 'US',
              clientName: 'WEB',
              clientVersion: clientVer
            }
          },
          continuation: continuationToken
        }),
        signal: AbortSignal.timeout(10000)
      });

      if (!contRes.ok) break;

      const contData = await contRes.json();

      function walkContinuation(node) {
        if (!node || typeof node !== 'object') return;
        if (Array.isArray(node)) {
          let arrayVideos = 0;
          let arrayToken = null;
          for (const el of node) {
            const v = parseYouTubeVideoItem(el);
            if (v && v.videoId) {
              arrayVideos++;
              if (!videosMap.has(v.videoId)) {
                videosMap.set(v.videoId, v);
              }
            }
            const tok = extractContinuationToken(el);
            if (tok) arrayToken = tok;
            if (!v && !tok) walkContinuation(el);
          }
          if (arrayVideos > 0 && arrayToken) {
            nextContToken = arrayToken;
          }
        } else {
          for (const k of Object.keys(node)) {
            walkContinuation(node[k]);
          }
        }
      }

      walkContinuation(contData);
    } catch {
      break;
    }

    continuationToken = nextContToken;
    if (videosMap.size > 2500) break; // generous safety ceiling
  }

  // If scraper gathered videos, return all of them
  if (videosMap.size > 0) {
    const videos = Array.from(videosMap.values());
    return { playlistId, videos, source: 'youtube-playlist-full' };
  }

  // Graceful fallback to RSS if initial parsing yielded zero items
  const rssVideos = await fetchYouTubePlaylistVideosRSS(playlistId);
  return { playlistId, videos: rssVideos, source: 'youtube-rss-fallback' };
}

// ─── LOCAL MEDIA FALLBACKS (when external links aren't set yet) ──

async function getLocalFallbackPhotos() {
  try {
    let items = [];
    if (isDbReady() && Media) {
      items = await Media.find({ type: 'photo', mediaType: 'sursukoon' }).sort({ order: 1, createdAt: -1 });
    } else {
      items = (store.media || []).filter(m => m.type === 'photo' && m.mediaType === 'sursukoon');
    }
    return items.map((p, i) => ({
      id: p._id || `local-p-${i}`,
      thumbUrl: p.url,
      fullUrl: p.url,
      url: p.url,
      title: p.title || `Sur-Sukoon Photo ${i + 1}`,
      category: p.category || ''
    }));
  } catch {
    return [];
  }
}

async function getLocalFallbackVideos() {
  try {
    let items = [];
    if (isDbReady() && Media) {
      items = await Media.find({ type: 'video', mediaType: 'sursukoon' }).sort({ order: 1, createdAt: -1 });
    } else {
      items = (store.media || []).filter(m => m.type === 'video' && m.mediaType === 'sursukoon');
    }
    return items.map((v, i) => {
      const videoId = extractYouTubeVideoId(v.url);
      return {
        videoId,
        title: v.title || `Sur-Sukoon Video ${i + 1}`,
        author: 'Sur-Sukoon',
        thumbnailUrl: videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '/images/hero-stage-thumb.jpg',
        duration: '',
        url: v.url
      };
    }).filter(v => v.videoId);
  } catch {
    return [];
  }
}

// ─── PUBLIC ROUTE HANDLERS ──────────────────────────────────────

const getGalleryPhotos = async (req, res) => {
  try {
    const albumUrl = String(await getSettingValue('googlePhotosAlbumUrl') || '').trim();
    const forceRefresh = req.query.refresh === '1';

    if (!albumUrl) {
      const localPhotos = await getLocalFallbackPhotos();
      return res.json({
        success: true,
        source: 'local',
        cached: false,
        configured: false,
        count: localPhotos.length,
        data: localPhotos
      });
    }

    if (!forceRefresh && isCacheFresh(galleryCache.photos, albumUrl)) {
      return res.json({
        success: true,
        source: 'google-photos',
        cached: true,
        configured: true,
        cachedAt: new Date(galleryCache.photos.fetchedAt).toISOString(),
        count: galleryCache.photos.data.length,
        data: galleryCache.photos.data
      });
    }

    const photos = await scrapeGooglePhotosAlbum(albumUrl);
    galleryCache.photos = {
      url: albumUrl,
      data: photos,
      fetchedAt: Date.now(),
      error: null
    };

    return res.json({
      success: true,
      source: 'google-photos',
      cached: false,
      configured: true,
      cachedAt: new Date(galleryCache.photos.fetchedAt).toISOString(),
      count: photos.length,
      data: photos
    });
  } catch (err) {
    galleryCache.photos.error = err.message;
    if (galleryCache.photos.data && galleryCache.photos.data.length) {
      return res.json({
        success: true,
        source: 'google-photos',
        cached: true,
        stale: true,
        warning: err.message,
        count: galleryCache.photos.data.length,
        data: galleryCache.photos.data
      });
    }
    const localPhotos = await getLocalFallbackPhotos();
    return res.json({
      success: true,
      source: 'fallback',
      configured: true,
      warning: err.message,
      count: localPhotos.length,
      data: localPhotos
    });
  }
};

const getGalleryVideos = async (req, res) => {
  try {
    const playlistUrl = String(await getSettingValue('youtubePlaylistUrl') || '').trim();
    const forceRefresh = req.query.refresh === '1';

    if (!playlistUrl) {
      const localVideos = await getLocalFallbackVideos();
      return res.json({
        success: true,
        source: 'local',
        cached: false,
        configured: false,
        count: localVideos.length,
        data: localVideos
      });
    }

    if (!forceRefresh && isCacheFresh(galleryCache.videos, playlistUrl)) {
      return res.json({
        success: true,
        source: 'youtube-playlist',
        cached: true,
        configured: true,
        cachedAt: new Date(galleryCache.videos.fetchedAt).toISOString(),
        count: galleryCache.videos.data.length,
        data: galleryCache.videos.data
      });
    }

    const { playlistId, videos, source } = await fetchYouTubePlaylistVideos(playlistUrl);
    galleryCache.videos = {
      url: playlistUrl,
      data: videos,
      fetchedAt: Date.now(),
      error: null
    };

    return res.json({
      success: true,
      source: source || 'youtube-playlist',
      cached: false,
      configured: true,
      playlistId,
      cachedAt: new Date(galleryCache.videos.fetchedAt).toISOString(),
      count: videos.length,
      data: videos
    });
  } catch (err) {
    galleryCache.videos.error = err.message;
    if (galleryCache.videos.data && galleryCache.videos.data.length) {
      return res.json({
        success: true,
        source: 'youtube-playlist',
        cached: true,
        stale: true,
        warning: err.message,
        count: galleryCache.videos.data.length,
        data: galleryCache.videos.data
      });
    }
    const localVideos = await getLocalFallbackVideos();
    return res.json({
      success: true,
      source: 'fallback',
      configured: true,
      warning: err.message,
      count: localVideos.length,
      data: localVideos
    });
  }
};

// ─── ADMIN ROUTE HANDLERS ───────────────────────────────────────

const getGalleryConfig = async (req, res) => {
  try {
    const googlePhotosAlbumUrl = await getSettingValue('googlePhotosAlbumUrl');
    const youtubePlaylistUrl = await getSettingValue('youtubePlaylistUrl');

    res.json({
      success: true,
      data: {
        googlePhotosAlbumUrl: googlePhotosAlbumUrl || '',
        youtubePlaylistUrl: youtubePlaylistUrl || '',
        cache: {
          ttlMinutes: Math.round(CACHE_TTL_MS / 60000),
          photosCount: galleryCache.photos.data ? galleryCache.photos.data.length : null,
          photosCachedAt: galleryCache.photos.fetchedAt ? new Date(galleryCache.photos.fetchedAt).toISOString() : null,
          photosError: galleryCache.photos.error,
          videosCount: galleryCache.videos.data ? galleryCache.videos.data.length : null,
          videosCachedAt: galleryCache.videos.fetchedAt ? new Date(galleryCache.videos.fetchedAt).toISOString() : null,
          videosError: galleryCache.videos.error
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateGalleryConfig = async (req, res) => {
  try {
    const googlePhotosAlbumUrl = String(req.body.googlePhotosAlbumUrl || '').trim();
    const youtubePlaylistUrl = String(req.body.youtubePlaylistUrl || '').trim();

    if (googlePhotosAlbumUrl && !isAllowedGooglePhotosUrl(googlePhotosAlbumUrl)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Google Photos URL. Please enter a public photos.app.goo.gl or photos.google.com/share/... link.'
      });
    }

    if (youtubePlaylistUrl && !extractYouTubePlaylistId(youtubePlaylistUrl)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid YouTube Playlist URL. Please enter a link containing ?list=YOUR_PLAYLIST_ID.'
      });
    }

    await saveSettingValue('googlePhotosAlbumUrl', googlePhotosAlbumUrl);
    await saveSettingValue('youtubePlaylistUrl', youtubePlaylistUrl);
    clearGalleryCache();

    res.json({
      success: true,
      message: 'Gallery configuration saved and cache cleared!',
      data: { googlePhotosAlbumUrl, youtubePlaylistUrl }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const syncGalleryMedia = async (req, res) => {
  try {
    clearGalleryCache();
    const googlePhotosAlbumUrl = String(await getSettingValue('googlePhotosAlbumUrl') || '').trim();
    const youtubePlaylistUrl = String(await getSettingValue('youtubePlaylistUrl') || '').trim();

    const summary = {
      photos: { configured: !!googlePhotosAlbumUrl, count: 0, error: null },
      videos: { configured: !!youtubePlaylistUrl, count: 0, error: null },
      syncedAt: new Date().toISOString()
    };

    if (googlePhotosAlbumUrl) {
      try {
        const photos = await scrapeGooglePhotosAlbum(googlePhotosAlbumUrl);
        galleryCache.photos = { url: googlePhotosAlbumUrl, data: photos, fetchedAt: Date.now(), error: null };
        summary.photos.count = photos.length;
      } catch (err) {
        galleryCache.photos.error = err.message;
        summary.photos.error = err.message;
      }
    }

    if (youtubePlaylistUrl) {
      try {
        const { videos } = await fetchYouTubePlaylistVideos(youtubePlaylistUrl);
        galleryCache.videos = { url: youtubePlaylistUrl, data: videos, fetchedAt: Date.now(), error: null };
        summary.videos.count = videos.length;
      } catch (err) {
        galleryCache.videos.error = err.message;
        summary.videos.error = err.message;
      }
    }

    res.json({
      success: true,
      message: 'Gallery cache cleared and media synced.',
      data: summary
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getGalleryPhotos,
  getGalleryVideos,
  getGalleryConfig,
  updateGalleryConfig,
  syncGalleryMedia
};
