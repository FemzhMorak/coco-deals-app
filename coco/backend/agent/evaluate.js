// Uses Claude to judge whether a newly-discovered URL looks like a
// legitimate Nigerian brand/store that regularly runs promotions —
// filtering the agent's raw search results down to sources worth crawling.
const Anthropic = require('@anthropic-ai/sdk');

const MODEL = 'claude-sonnet-4-6';

let client = null;
function getClient() {
  if (!client) client = new Anthropic(); // reads ANTHROPIC_API_KEY from env
  return client;
}

function buildPrompt(url) {
  return `Is this a legitimate Nigerian brand or store that regularly runs promotions or discounts? URL: ${url}. Reply with JSON: {isLegitimate: true/false, brandName: string, category: string, confidence: 0-100}`;
}

// Pulls the first {...} object out of the response text and parses it —
// robust to Claude wrapping the JSON in a sentence or code fence, without
// needing a separate structured-output request shape for this low-volume,
// low-stakes classification call.
function parseVerdict(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    return {
      isLegitimate: Boolean(parsed.isLegitimate),
      brandName: typeof parsed.brandName === 'string' ? parsed.brandName : null,
      category: typeof parsed.category === 'string' ? parsed.category : null,
      confidence: Number.isFinite(Number(parsed.confidence)) ? Number(parsed.confidence) : 0,
    };
  } catch {
    return null;
  }
}

// Returns null if the API call or parsing fails — caller treats that as
// "couldn't evaluate, skip" rather than guessing a confidence.
async function evaluateSource(url) {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('[agent] ANTHROPIC_API_KEY not set — skipping AI evaluation for', url);
    return null;
  }
  try {
    const response = await getClient().messages.create({
      model: MODEL,
      max_tokens: 300,
      messages: [{ role: 'user', content: buildPrompt(url) }],
    });
    const textBlock = response.content.find((b) => b.type === 'text');
    return textBlock ? parseVerdict(textBlock.text) : null;
  } catch (err) {
    console.warn(`[agent] evaluation failed for ${url}: ${err.message}`);
    return null;
  }
}

module.exports = { evaluateSource, MODEL };
