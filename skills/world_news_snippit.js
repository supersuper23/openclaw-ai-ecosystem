async function worldNewsSnippit(web_search) {
  const query = "site:reddit.com world news";
  const results = await web_search({ query: query, count: 3 });
  let worldNewsSummary = "**Top Three World News Items**\n";
  if (results && results.content) {
    worldNewsSummary += results.content;
  } else {
    worldNewsSummary += "No World News items";
  }
  return worldNewsSummary;
}