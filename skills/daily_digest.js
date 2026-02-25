/*
 * Skill: Daily Reddit Digest
 * Sources everything from Reddit for high-speed, community-vetted updates.
 */
async function summarizeNews(injectedSearch) {
 const search = injectedSearch || (typeof web_search !== 'undefined' ? web_search : null);
 if (!search) return "❌ Error: Search tool not found in OpenClaw.";

 // Helper to fetch and clean text from specific Reddit queries
 async function fetchReddit(topicQuery) {
 try {
 const res = await search({ query: `site:reddit.com ${topicQuery}`, count: 3, freshness: "pd" });
 // Prioritize full content over the short answer for better detail
 return res?.content  res?.answer  "_No recent discussions found._";
 } catch (e) {
 return "_Source temporarily unavailable._";
 }
 }

 // --- Parallel Execution for Speed ---
 const [market, trending, world, openClaw] = await Promise.all([
 fetchReddit('r/stocks OR r/options \"Hertz\" OR \"Silver\" OR \"Copper\" OR \"RKLB\"'),
 fetchReddit('r/all \"top posts today\"'),
 fetchReddit('r/worldnews \"breaking\"'),
 fetchReddit('\"OpenClaw\" OR \"Clawdbot\"')
 ]);

 // --- Beautiful Formatting for Telegram ---
 return `
 🌅 *YOUR DAILY REDDIT DIGEST* ━━━━━━━━━━━━━━━━━━ 
 📊 *MARKET WATCH: TICKER TRENDS*
 ━━━━━━━━━━━━━━━━━━
 ${market}

 🔥 *REDDIT FRONT PAGE (TOP 5)*
 ━━━━━━━━━━━━━━━━━━
 ${trending}

 🌍 *GLOBAL REDDIT HEADLINES*
 ━━━━━━━━━━━━━━━━━━
 ${world}

 🦞 *OPENCLAW PROJECT STATUS*
 ━━━━━━━━━━━━━━━━━━
 ${openClaw}

 📅 _Updated: ${new Date().toLocaleDateString()} | 24h Window_
 `;
}

// Execution block for Buster
if (typeof agentTurn !== 'undefined') {
 const finalDigest = await summarizeNews(web_search);
 // Send the clean, formatted message directly to your Telegram
 return await message({ text: finalDigest, parse_mode: "Markdown" });
 }