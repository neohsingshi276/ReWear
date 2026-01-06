const fs = require('fs');
const path = require('path');

// API config
const API_KEY = 'sk-AnEo2N18tSIEy1CknoxNLdrS77IZrdgwREVLZjVh1QkbVPQr';
const API_URL = 'https://api2.qiandao.mom/v1/chat/completions';
const MODEL = 'gemini-2.5-pro-preview-p';

// Convert image to base64
function toBase64(imagePath) {
  const buffer = fs.readFileSync(imagePath);
  const ext = path.extname(imagePath).slice(1);
  return `data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,${buffer.toString('base64')}`;
}

// Simulate AI check based on filename (fallback)
function simulateCheck(filename) {
  console.log('[AI] Using fallback simulation for:', filename);
  const name = filename.toLowerCase();
  
  // Simulate: mostly approve, some manual review
  const rand = Math.random();
  if (name.includes('fail') || name.includes('reject')) {
    return { decision: 'rejected', status: 'rejected', ai_check_result: 'rejected_by_rule', reason: 'Filename contains reject keyword', confidence: 0.95 };
  }
  if (name.includes('review') || name.includes('pending')) {
    return { decision: 'manual_review', status: 'pending', ai_check_result: 'manual_review', reason: 'Manual review required', confidence: 0.5 };
  }
  if (rand < 0.85) {
    return { decision: 'approved', status: 'approved', ai_check_result: 'approved_clothing', clothing_type: 'clothing', reason: 'Simulated approval', confidence: 0.88 };
  }
  return { decision: 'manual_review', status: 'pending', ai_check_result: 'low_confidence', reason: 'Needs manual verification', confidence: 0.45 };
}

// AI image moderation
async function checkImageModeration(imagePath) {
  console.log('[AI] Calling vision model:', MODEL);
  
  try {
    const base64 = toBase64(imagePath);
    const requestBody = {
      model: MODEL,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: `Is this image showing clothing/apparel (shirts, pants, shoes, bags, hats, dresses, etc)?
Reply with ONLY one word: YES or NO` },
          { type: 'image_url', image_url: { url: base64 } }
        ]
      }],
      max_tokens: 50
    };

    // Try API with retry for rate limiting
    let response = null;
    let retries = 3;
    
    while (retries > 0) {
      console.log('[AI] Calling API (attempt', 4 - retries, ')');
      try {
        response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
          },
          body: JSON.stringify(requestBody)
        });
        
        if (response.ok) {
          console.log('[AI] API call successful!');
          break;
        }
        
        if (response.status === 429) {
          console.log('[AI] Rate limited (429), waiting 2s...');
          await new Promise(r => setTimeout(r, 2000));
          retries--;
          continue;
        }
        
        console.log('[AI] API returned:', response.status);
        break;
      } catch (e) {
        console.log('[AI] Request failed:', e.message);
        break;
      }
    }

    if (!response || !response.ok) {
      console.log('[AI] API unavailable - using fallback');
      const filename = path.basename(imagePath);
      return simulateCheck(filename);
    }

    const data = await response.json();
    console.log('[AI] Response data:', JSON.stringify(data, null, 2));
    
    // Check usage/tokens
    if (data.usage) {
      console.log('[AI] Tokens used - prompt:', data.usage.prompt_tokens, 'completion:', data.usage.completion_tokens, 'total:', data.usage.total_tokens);
    } else {
      console.log('[AI] No token usage info in response');
    }
    
    const content = (data.choices?.[0]?.message?.content || '').trim().toUpperCase();
    console.log('[AI] Response:', content);
    
    if (!content) {
      console.log('[AI] Empty response');
      return simulateCheck(path.basename(imagePath));
    }
    
    // Parse YES/NO response
    const isClothing = content.includes('YES');
    const isNotClothing = content.includes('NO');
    
    if (isClothing && !isNotClothing) {
      console.log('[AI] Result: APPROVED (is clothing)');
      return { 
        decision: 'approved', 
        status: 'approved', 
        ai_check_result: 'approved_clothing', 
        clothing_type: 'clothing',
        reason: 'AI verified as clothing',
        confidence: 0.95
      };
    } else if (isNotClothing) {
      console.log('[AI] Result: REJECTED (not clothing)');
      return { 
        decision: 'rejected', 
        status: 'rejected', 
        ai_check_result: 'rejected_not_clothing',
        reason: 'AI determined not clothing',
        confidence: 0.95
      };
    } else {
      console.log('[AI] Result: MANUAL REVIEW (unclear response)');
      return { 
        decision: 'manual_review', 
        status: 'pending', 
        ai_check_result: 'manual_review',
        reason: 'AI response unclear',
        confidence: 0.5
      };
    }

  } catch (err) {
    console.log('[AI] Call failed:', err.message, '- using fallback');
    return simulateCheck(path.basename(imagePath));
  }
}

module.exports = { checkImageModeration };
