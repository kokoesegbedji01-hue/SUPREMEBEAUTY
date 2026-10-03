SUPREME BEAUTY SITE - VERSION 3

Main nav: Home | Shop | Supreme Standard | Research | Community | Supreme Connect | About
Secondary pages (not in main nav): Brands, Experience, Founder, Waitlist

Research: 7 articles, each based on peer-reviewed sources with a Sources list.
Sections with no verified peer-reviewed source (Claims & Marketing, Inside the Bottle) are intentionally empty.
To add an article, only cite sources you have read and verified (journal, year, DOI).

Waitlist form submits through FormSubmit to jessica.supreme2@gmail.com. The first submission triggers a verification email that must be confirmed once.
Before launch, consider replacing it with a proper email/CRM tool.

Assets: SBlogo.PNG, bottleSB.png, bottlesSB.png, pinkbottle.png, packagingSB.png, jessicahold.png, SBfavicon.png

V3 notes:
- Founder: Jessica Supreme (LinkedIn linked on About, Founder page, and footer).
- Added: What We Do, Privacy, Terms, and Thank You pages. The join form redirects to thanks.html after submitting.
- Privacy/Terms are plain-language drafts. Have an attorney review them before launch.
- Shop, Supreme Connect directory, forum, and accounts are presented as early access. They need real backends before they can work as live features.

V4 notes:
- Research: 14 articles (7 new: biotin, oral minoxidil, psychological impact of hair loss, retinoids, sunscreen, acne guidelines, hair dye/straighteners and breast cancer). Empty "Claims" and "Inside the Bottle" sections removed. Added a "How we review research" section.
- IMPORTANT: new articles were written without live internet access. Before launch, verify every citation (authors, journal, year, volume, pages) and each finding against the original paper on PubMed, then add DOI links.
- New: acquisitions.html (inquiry form via FormSubmit), "Acquisitions" nav link, brand story on Home/About/Community.
- New: Beauty Finder on connect.html (finder.js). ZIP lookup via zippopotam.us, listings from OpenStreetMap via Overpass API (addresses/phones appear only where volunteers entered them). All results are labeled pending review for the Supreme Standard.
- New: Suprema chatbot (chatbot.js) on every page. It answers from a built-in set of sourced answers and site help. A free-form AI chatbot needs a server (e.g., a Vercel function holding an API key); this version needs none.

V5 notes (chatbot):
- Chatbot is conversational (greetings, small talk, jokes) and answers site questions.
- For science questions not on the site, it calls api/chat.js, which uses the Anthropic API with web search limited to scholarly/clinical domains (PubMed, journals, AAD, NIH, etc.) and shows clickable source links.
- SETUP on Vercel: Project Settings > Environment Variables > add ANTHROPIC_API_KEY (from console.anthropic.com). Web search must be enabled for your Anthropic organization. Redeploy afterward. Optional: ANTHROPIC_MODEL. Usage is billed to your Anthropic account; the function limits each visitor to 30 questions per hour.
- Without the key (or when opened locally) the bot still works from its built-in answers and says live search is not connected.
- Article sources now have "View on PubMed" links that search for the exact paper title. Replace with DOI links when you have verified them.
