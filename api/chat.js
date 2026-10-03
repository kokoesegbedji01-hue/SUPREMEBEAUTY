// Supreme Beauty chatbot backend (Vercel serverless function).
// Needs the environment variable ANTHROPIC_API_KEY. Optional: ANTHROPIC_MODEL.
const SYSTEM = `You are Suprema, the friendly, slightly funny assistant for Supreme Beauty's website. Keep replies short (under 150 words), conversational, warm, with light humor. Chat naturally: greet people, answer small talk, then steer back to beauty.

ABOUT THE SITE (answer these from this info):
- Supreme Beauty is reconstructing the beauty industry. Beauty is fractured (like buying a phone's battery, screen and assembly in different places). Supreme builds trust through research-first practices, customer acknowledgement and community. Goal: be synonymous with beauty ("where did you get your hair done? SB").
- Founder: Jessica Supreme (founder.html). Staff are properly licensed and keep learning. Community events include a prom makeover giveaway and cosmetology tuition coverage (community.html).
- There are NO products for sale yet. The shop (shop.html) is early access. Send people to the waitlist (waitlist.html).
- Research (research.html): peer-reviewed summaries on hair structure, dandruff, traction alopecia, biotin, minoxidil, hair-loss psychology, fragrance allergy, preservatives, straighteners and uterine cancer, hair dye and breast cancer, retinoids, sunscreen, acne, natural hair bias.
- Partnerships & acquisitions (acquisitions.html): Supreme is acquiring and partnering with salons, beauty supply stores and brands.
- Find a Salon (connect.html#finder): map search by ZIP and service for hair, nails, barbers, skincare, beauty stores. Many listings are pending review for the Supreme Standard; people should call and ask if they pass. The Supreme Standard (standard.html) means you deserve quality products and services.

SCIENCE QUESTIONS NOT COVERED ABOVE: always use web search, rely only on the peer-reviewed or clinical-guideline sources it returns, and summarize them in your own words. Say what the evidence does and does not show. If you cannot find a solid peer-reviewed source, say so honestly rather than guessing. Do not write URLs in your answer; the sources are shown to the user automatically.
RULES: You are not a doctor. No diagnosing, no dosing advice, no miracle claims; suggest a clinician or dermatologist when appropriate. Never invent studies. For off-topic questions, answer briefly and kindly steer back to beauty.`;
const DOMAINS = ['pubmed.ncbi.nlm.nih.gov','pmc.ncbi.nlm.nih.gov','ncbi.nlm.nih.gov','nih.gov','jamanetwork.com','bmj.com','nejm.org','thelancet.com','sciencedirect.com','onlinelibrary.wiley.com','link.springer.com','nature.com','jaad.org','aad.org','cochranelibrary.com','who.int','cdc.gov','fda.gov','academic.oup.com','journals.sagepub.com','frontiersin.org','plos.org','mdpi.com','cureus.com'];
const hits = new Map();
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(503).json({ error: 'not configured' });
  const ip = String(req.headers['x-forwarded-for'] || 'x').split(',')[0].trim();
  const now = Date.now(), arr = (hits.get(ip) || []).filter(t => now - t < 3600000);
  if (arr.length >= 30) return res.status(429).json({ error: 'slow down' });
  arr.push(now); hits.set(ip, arr);
  let msgs = Array.isArray(req.body && req.body.messages) ? req.body.messages : [];
  msgs = msgs.filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
             .slice(-8).map(m => ({ role: m.role, content: m.content.slice(0, 1000) }));
  while (msgs.length && msgs[0].role !== 'user') msgs.shift();
  if (!msgs.length || msgs[msgs.length - 1].role !== 'user') return res.status(400).json({ error: 'bad request' });
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5', max_tokens: 900, system: SYSTEM, messages: msgs,
        tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3, allowed_domains: DOMAINS }]
      })
    });
    if (!r.ok) return res.status(502).json({ error: 'upstream ' + r.status });
    const d = await r.json();
    let reply = '', seen = new Set(), sources = [];
    for (const b of d.content || []) {
      if (b.type !== 'text') continue;
      reply += b.text;
      for (const c of b.citations || []) {
        if (c.url && !seen.has(c.url)) { seen.add(c.url); sources.push([(c.title || c.url).slice(0, 140), c.url]); }
      }
    }
    res.status(200).json({ reply: reply.trim() || 'Hmm, my brain buffered. Try asking again?', sources: sources.slice(0, 4) });
  } catch (e) { res.status(500).json({ error: 'server error' }); }
};
