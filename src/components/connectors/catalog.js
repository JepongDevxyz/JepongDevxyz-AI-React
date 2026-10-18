/* catalog.js — 63 connector entries, grouped.
   kind: "oauth" (Connect button → /api/connectors/:id/authorize, PKCE server-side)
         "apikey" (API-key form → naka-wire sa CredentialVault)
         "custom"  (Custom Connector builder → localStorage) */

export const GROUPS = [
  "Google",
  "GitHub",
  "Productivity",
  "Communication",
  "AI Providers",
  "Search & Web",
  "Developer",
  "Media",
  "Payments",
  "Data",
  "Custom",
];

const C = (id, name, group, kind, blurb) => ({ id, name, group, kind, blurb });

export const CONNECTOR_CATALOG = [
  /* Google trio — OAuth */
  C("gmail", "Gmail", "Google", "oauth", "Magbasa at mag-search ng emails; OTP auto-fetch"),
  C("gcalendar", "Google Calendar", "Google", "oauth", "Basahin at gumawa ng calendar events"),
  C("gdrive", "Google Drive", "Google", "oauth", "Files para sa Library cloud tab"),
  /* GitHub */
  C("github", "GitHub", "GitHub", "oauth", "Repos, issues, PRs — may repo list card"),
  /* Productivity */
  C("notion", "Notion", "Productivity", "apikey", "Pages at databases"),
  C("slack", "Slack", "Productivity", "oauth", "Magpadala at magbasa ng messages"),
  C("discord", "Discord", "Productivity", "oauth", "Servers at channels"),
  C("trello", "Trello", "Productivity", "apikey", "Boards at cards"),
  C("asana", "Asana", "Productivity", "oauth", "Tasks at projects"),
  C("todoist", "Todoist", "Productivity", "apikey", "Task list"),
  C("evernote", "Evernote", "Productivity", "oauth", "Notes"),
  C("onenote", "OneNote", "Productivity", "oauth", "Microsoft notes"),
  C("dropbox", "Dropbox", "Productivity", "oauth", "Files para sa Library cloud tab"),
  C("box", "Box", "Productivity", "oauth", "Cloud files"),
  /* Communication */
  C("telegram", "Telegram", "Communication", "apikey", "Bot messages"),
  C("whatsapp", "WhatsApp", "Communication", "apikey", "Business messaging"),
  C("messenger", "Messenger", "Communication", "oauth", "Page inbox (official route)"),
  C("twilio", "Twilio", "Communication", "apikey", "SMS at voice"),
  C("sendgrid", "SendGrid", "Communication", "apikey", "Transactional email"),
  C("mailchimp", "Mailchimp", "Communication", "apikey", "Newsletters"),
  C("zoom", "Zoom", "Communication", "oauth", "Meetings"),
  C("gmeet", "Google Meet", "Communication", "oauth", "Video meetings via Calendar"),
  /* AI Providers */
  C("openai", "OpenAI", "AI Providers", "apikey", "GPT models"),
  C("anthropic", "Anthropic", "AI Providers", "apikey", "Claude models"),
  C("googleai", "Google AI", "AI Providers", "apikey", "Gemini models"),
  C("groq", "Groq", "AI Providers", "apikey", "Mabilis na inference"),
  C("mistral", "Mistral", "AI Providers", "apikey", "Mistral models"),
  C("cohere", "Cohere", "AI Providers", "apikey", "Embed at chat"),
  C("together", "Together AI", "AI Providers", "apikey", "Open models"),
  C("openrouter", "OpenRouter", "AI Providers", "apikey", "Model router"),
  C("perplexity", "Perplexity", "AI Providers", "apikey", "Search-grounded answers"),
  C("deepseek", "DeepSeek", "AI Providers", "apikey", "DeepSeek models"),
  /* Search & Web */
  C("tavily", "Tavily", "Search & Web", "apikey", "AI search API"),
  C("serper", "Serper", "Search & Web", "apikey", "Google search API"),
  C("brave", "Brave Search", "Search & Web", "apikey", "Independent search"),
  C("exa", "Exa", "Search & Web", "apikey", "Neural search"),
  C("firecrawl", "Firecrawl", "Search & Web", "apikey", "Web scraping"),
  C("steel", "Steel", "Search & Web", "apikey", "Browser pool para sa Agent Browse"),
  C("browserless", "Browserless", "Search & Web", "apikey", "Headless browser"),
  C("apify", "Apify", "Search & Web", "apikey", "Web scrapers"),
  /* Developer */
  C("vercel", "Vercel", "Developer", "apikey", "Deployments at projects"),
  C("supabase", "Supabase", "Developer", "apikey", "Database at auth"),
  C("firebase", "Firebase", "Developer", "apikey", "RTDB at auth"),
  C("cloudflare", "Cloudflare", "Developer", "apikey", "DNS at workers"),
  C("aws", "AWS", "Developer", "apikey", "Cloud services"),
  C("digitalocean", "DigitalOcean", "Developer", "apikey", "Droplets"),
  C("netlify", "Netlify", "Developer", "apikey", "Static deploys"),
  C("railway", "Railway", "Developer", "apikey", "App hosting"),
  /* Media */
  C("youtube", "YouTube", "Media", "oauth", "Videos at uploads"),
  C("spotify", "Spotify", "Media", "oauth", "Music at playback"),
  C("cloudinary", "Cloudinary", "Media", "apikey", "Image/video CDN"),
  C("unsplash", "Unsplash", "Media", "apikey", "Stock photos"),
  C("pexels", "Pexels", "Media", "apikey", "Stock photos/videos"),
  C("elevenlabs", "ElevenLabs", "Media", "apikey", "Text-to-speech"),
  /* Payments */
  C("stripe", "Stripe", "Payments", "apikey", "Payments at billing"),
  C("paymongo", "PayMongo", "Payments", "apikey", "QRPh top-ups"),
  C("lemonsqueezy", "Lemon Squeezy", "Payments", "apikey", "Digital products"),
  /* Data */
  C("airtable", "Airtable", "Data", "apikey", "Bases at tables"),
  C("gsheets", "Google Sheets", "Data", "oauth", "Spreadsheets"),
  C("postgres", "PostgreSQL", "Data", "custom", "Direct DB connection"),
  C("mongodb", "MongoDB", "Data", "apikey", "Document DB"),
  C("redis", "Redis", "Data", "custom", "Cache at KV"),
  /* Custom */
  C("custom", "Custom Connector", "Custom", "custom", "Sariling API: name + base URL + auth"),
];

export function getConnector(id) {
  return CONNECTOR_CATALOG.find((c) => c.id === id) || null;
}

export function countByGroup() {
  const m = {};
  for (const c of CONNECTOR_CATALOG) m[c.group] = (m[c.group] || 0) + 1;
  return m;
}
