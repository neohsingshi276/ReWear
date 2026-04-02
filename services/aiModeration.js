const fs = require('fs');
const sharp = require('sharp');

/**
 * AI moderation + Brand + Category(Type) verification
 *
 * What this version does:
 * - Compress image to avoid 413.
 * - Verify CATEGORY/TYPE using UI dropdown (Tops/Shoes/etc).
 * - Verify BRAND (Nike/Adidas/etc) only when user provides brand.
 *
 * NOTE:
 * - You said you hard-coded key (). You can paste it below.
 * - Safer way is environment variable AI_API_KEY, but we keep your current style compatible.
 */

// ---- API config ----
const API_KEY = process.env.AI_API_KEY || 'sk-AnEo2N18tSIEy1CknoxNLdrS77IZrdgwREVLZjVh1QkbVPQr';
const API_URL = process.env.AI_API_URL || 'https://api2.qiandao.mom/v1/chat/completions';
const MODEL = process.env.AI_MODEL || 'gemini-2.5-pro-preview-p';

// ---- Brand aliases (expand anytime) ----
const BRAND_ALIASES = [
  { key: 'nike', aliases: ['nike'] },
  { key: 'adidas', aliases: ['adidas', 'adi'] },
  { key: 'puma', aliases: ['puma'] },
  { key: 'zara', aliases: ['zara'] },
  { key: 'uniqlo', aliases: ['uniqlo'] },
  { key: 'h&m', aliases: ['h&m', 'hm', 'h and m'] },
  { key: 'new balance', aliases: ['new balance', 'nb'] },
  { key: 'converse', aliases: ['converse'] },
  { key: 'vans', aliases: ['vans'] },
];

function normalize(s) {
  return (s || '').toString().trim().toLowerCase();
}

function extractExpectedBrand(inputText) {
  const t = normalize(inputText);
  if (!t) return '';

  for (const item of BRAND_ALIASES) {
    for (const a of item.aliases) {
      if (t.includes(a)) return item.key;
    }
  }
  return '';
}

// Map UI Category -> AI item_type
function normalizeCategoryToType(categoryText) {
  const c = normalize(categoryText);

  // matches your dropdown: Tops, Sweaters, Bottoms, Dresses, Outerwear, Shoes, Accessories
  if (c === 'tops') return 'top';
  if (c === 'sweaters' || c === 'sweater') return 'top'; // treat sweaters as top
  if (c === 'bottoms' || c === 'bottom') return 'bottom';
  if (c === 'dresses' || c === 'dress') return 'dress';
  if (c === 'outerwear' || c === 'outer') return 'outerwear';
  if (c === 'shoes' || c === 'shoe') return 'shoe';
  if (c === 'accessories' || c === 'accessory') return 'accessory';

  return '';
}

// Fallback: if user types "nike shoes" "nike衣服" etc. (when category isn't provided)
function extractExpectedTypeFromText(text) {
  const t = normalize(text);
  if (!t) return '';

  const shoeWords = ['shoe', 'shoes', 'sneaker', 'sneakers', 'boot', 'boots', '鞋', '球鞋', '运动鞋', '靴'];
  const topWords = ['t-shirt', 'tshirt', 'tee', 'shirt', 'blouse', 'top', '上衣', '衣服', '衣', 't恤', '衬衫', 'sweater', 'hoodie', '卫衣', '毛衣'];
  const bottomWords = ['pants', 'trousers', 'jeans', 'shorts', '裤', '裤子', '牛仔裤', '短裤'];
  const dressWords = ['dress', '裙', '裙子', '连衣裙'];
  const outerWords = ['jacket', 'coat', 'outerwear', '外套', '夹克', '风衣'];
  const accessoryWords = ['hat', 'cap', 'bag', 'accessory', '帽', '帽子', '包', '包包'];

  if (shoeWords.some(w => t.includes(w))) return 'shoe';
  if (dressWords.some(w => t.includes(w))) return 'dress';
  if (outerWords.some(w => t.includes(w))) return 'outerwear';
  if (bottomWords.some(w => t.includes(w))) return 'bottom';
  if (accessoryWords.some(w => t.includes(w))) return 'accessory';
  if (topWords.some(w => t.includes(w))) return 'top';

  return '';
}

// Normalize AI returned item_type (in case it returns sneaker/shoes/etc)
function normalizeAiItemType(itemType) {
  const t = normalize(itemType);
  if (!t) return 'unknown';

  if (['shoe', 'shoes', 'sneaker', 'sneakers', 'boot', 'boots'].includes(t)) return 'shoe';
  if (['top', 'tops', 'shirt', 'tshirt', 't-shirt', 'sweater', 'hoodie'].includes(t)) return 'top';
  if (['bottom', 'bottoms', 'pants', 'trousers', 'jeans', 'shorts'].includes(t)) return 'bottom';
  if (['dress', 'dresses', 'skirt'].includes(t)) return 'dress';
  if (['outerwear', 'jacket', 'coat'].includes(t)) return 'outerwear';
  if (['accessory', 'accessories', 'bag', 'hat', 'cap'].includes(t)) return 'accessory';

  if (['shoe', 'top', 'bottom', 'dress', 'outerwear', 'accessory', 'unknown'].includes(t)) return t;

  return 'unknown';
}

function safeJsonParse(text) {
  if (!text) return null;
  try { return JSON.parse(text); } catch {}

  // try extract {...}
  const s = text.indexOf('{');
  const e = text.lastIndexOf('}');
  if (s !== -1 && e !== -1 && e > s) {
    try { return JSON.parse(text.slice(s, e + 1)); } catch {}
  }
  return null;
}

async function fetchWithTimeout(url, options, ms = 90000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// Compress image to avoid 413. Retry smaller if still 413.
async function toCompressedDataUrl(imagePath, preset = 0) {
  const input = fs.readFileSync(imagePath);

  const presets = [
    { width: 768, quality: 70 },
    { width: 512, quality: 60 },
    { width: 384, quality: 55 },
    { width: 320, quality: 50 },
    { width: 256, quality: 45 },
  ];
  const cfg = presets[Math.min(preset, presets.length - 1)];

  const out = await sharp(input)
    .resize({ width: cfg.width, withoutEnlargement: true })
    .jpeg({ quality: cfg.quality })
    .toBuffer();

  console.log(`[AI] Compressed image ~${Math.round(out.length / 1024)}KB (w=${cfg.width}, q=${cfg.quality})`);
  return `data:image/jpeg;base64,${out.toString('base64')}`;
}

function pending(reason, code = 'manual_review', confidence = 0) {
  return {
    decision: 'manual_review',
    status: 'pending',
    ai_check_result: code,
    reason,
    confidence,
  };
}

/**
 * checkImageModeration(imagePath, expectedText, expectedCategory)
 *
 * - expectedText: `${brand} ${title}` from server.js
 * - expectedCategory: UI dropdown value (Tops/Shoes/etc)
 */
async function checkImageModeration(imagePath, expectedText = '', expectedCategory = '') {
  const expectedBrand = extractExpectedBrand(expectedText); // only enforce if we can detect it from input
  const expectedType =
    normalizeCategoryToType(expectedCategory) ||
    extractExpectedTypeFromText(expectedText);

  console.log('[AI] Calling vision model:', MODEL);
  console.log('[AI] Expected brand:', expectedBrand || '(none)');
  console.log('[AI] Expected type:', expectedType || '(none)');

  if (!API_KEY || API_KEY === 'PASTE_YOUR_KEY_HERE') {
    return pending('Missing AI API key (set AI_API_KEY or paste into code).', 'missing_api_key');
  }

  const prompt = `
You are a product image verifier for a clothing marketplace.

Tasks:
1) Decide if the image shows apparel/clothing (including shoes, bags, hats).
2) Identify the brand ONLY if a logo/marking is clearly visible. If not visible, return "unknown". Do NOT guess.
3) Identify the item_type using ONLY this list:
   shoe | top | bottom | dress | outerwear | accessory | unknown
   - Shoes/sneakers/boots => "shoe"
   - T-shirt/shirt/sweater/hoodie => "top"
   - Pants/jeans/shorts => "bottom"

Expected brand: "${expectedBrand || 'none'}"
Expected type: "${expectedType || 'none'}"

Return ONLY one-line valid JSON (no markdown):
{
  "is_clothing": true/false,
  "item_type": "shoe|top|bottom|dress|outerwear|accessory|unknown",
  "brand": "nike|adidas|zara|h&m|uniqlo|puma|new balance|converse|vans|other|unknown",
  "confidence": 0-100,
  "reason": "short reason"
}
`.trim();

  for (let attempt = 0; attempt < 5; attempt++) {
    const dataUrl = await toCompressedDataUrl(imagePath, attempt);

    const requestBody = {
      model: MODEL,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: dataUrl } },
        ],
      }],
      max_tokens: 250,
    };

    console.log('[AI] Calling API (attempt', attempt + 1, ')');

    let response;
    try {
      response = await fetchWithTimeout(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      }, 90000);
    } catch (e) {
      console.log('[AI] Request failed:', e.message);
      const m = normalize(e?.message);
      if (m.includes('aborted') || m.includes('abort')) continue;
      return pending(`AI request failed: ${e.message}`, 'ai_request_failed');
    }

    if (response.status === 413) {
      console.log('[AI] API returned 413 -> compress more and retry');
      continue;
    }
    if (response.status === 429) {
      console.log('[AI] Rate limited (429), waiting 2s...');
      await new Promise(r => setTimeout(r, 2000));
      continue;
    }
    if (!response.ok) {
      console.log('[AI] API returned:', response.status);
      return pending(`AI HTTP ${response.status}`, `ai_http_${response.status}`);
    }

    const data = await response.json();
    const raw = (data.choices?.[0]?.message?.content || '').trim();
    console.log('[AI] Raw response:', raw);

    const parsed = safeJsonParse(raw);
    if (!parsed) return pending('AI did not return JSON.', 'ai_bad_json');

    const isClothing = !!parsed.is_clothing;
    const brand = normalize(parsed.brand);
    const aiType = normalizeAiItemType(parsed.item_type);
    const confidence = Math.max(0, Math.min(100, Number(parsed.confidence || 0))) / 100;

    console.log('[AI] is_clothing:', isClothing, '| brand:', brand, '| item_type:', aiType, '| confidence:', `${Math.round(confidence * 100)}%`);

    if (!isClothing) {
      return {
        decision: 'rejected',
        status: 'rejected',
        ai_check_result: 'rejected_not_clothing',
        reason: parsed.reason || 'Not clothing',
        confidence,
      };
    }

    // ✅ TYPE/CATEGORY verification (关键：防止 “Nike衣服” 但上传 “Nike鞋子” 通过)
    if (expectedType) {
      if (aiType === 'unknown') {
        return pending('Item type unclear in image', 'pending_type_unknown', confidence);
      }
      if (aiType !== expectedType) {
        return {
          decision: 'rejected',
          status: 'rejected',
          ai_check_result: 'rejected_type_mismatch',
          reason: `Expected ${expectedType}, got ${aiType}`,
          confidence,
        };
      }
    }

    // ✅ BRAND verification (only if user provided recognizable brand)
    if (expectedBrand) {
      if (!brand || brand === 'unknown') {
        return pending('Brand not visible/unclear', 'pending_brand_unknown', confidence);
      }
      if (brand !== expectedBrand) {
        return {
          decision: 'rejected',
          status: 'rejected',
          ai_check_result: 'rejected_brand_mismatch',
          reason: `Expected ${expectedBrand}, got ${brand}`,
          confidence,
        };
      }

      return {
        decision: 'approved',
        status: 'approved',
        ai_check_result: expectedType ? 'approved_brand_and_type_match' : 'approved_brand_match',
        clothing_type: aiType,
        reason: parsed.reason || 'Brand+type matched',
        confidence,
      };
    }

    // No expected brand => approve if clothing (+ type match if provided)
    return {
      decision: 'approved',
      status: 'approved',
      ai_check_result: expectedType ? 'approved_type_match' : 'approved_clothing',
      clothing_type: aiType,
      reason: parsed.reason || 'Clothing detected',
      confidence,
    };
  }

  return pending('AI failed after multiple attempts.', 'ai_failed');
}

module.exports = { checkImageModeration };
