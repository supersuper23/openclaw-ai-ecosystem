#!/usr/bin/env python3
import argparse
import calendar
import feedparser
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

parser = argparse.ArgumentParser(description="Reddit Daily Digest")
parser.add_argument('--limit', type=int, default=5, help='Total top stories')
parser.add_argument('--per-subreddit', type=int, default=25, help='Posts to fetch per subreddit')
parser.add_argument('--per-sub-cap', type=int, default=2, help='Max stories per subreddit')
parser.add_argument('--tz', default='Europe/Vienna', help='Timezone')
args = parser.parse_args()

subs = ['economics', 'business', 'stocks', 'wallstreetbets', 'investing', 'dataisbeautiful', 'europe', 'worldnews', 'geopolitics']

stories = []
now_local = datetime.now(ZoneInfo(args.tz))
cutoff_local = now_local - timedelta(hours=24)

for sub in subs:
    rss_url = f"https://www.reddit.com/r/{sub}/hot/.rss?limit={args.per_subreddit}&t=day"
    feed = feedparser.parse(rss_url)
    for entry in feed.entries:
        try:
            if not entry.published_parsed:
                continue
            pub_unix = calendar.timegm(entry.published_parsed)
            pub_dt_utc = datetime.fromtimestamp(pub_unix, tz=timezone.utc)
            pub_dt_local = pub_dt_utc.astimezone(ZoneInfo(args.tz))
            if pub_dt_local > cutoff_local:
                score_text = getattr(entry.score, 'text', '0') if hasattr(entry, 'score') else '0'
                score = int(score_text or 0)
                title = entry.title
                link = entry.link
                preview = (getattr(entry, 'description', '') or '')[:200].rstrip()
                if len(getattr(entry, 'description', '') or '') > 200:
                    preview += '...'
                stories.append({
                    'title': title,
                    'link': link,
                    'score': score,
                    'sub': sub,
                    'preview': preview
                })
        except Exception:
            continue

stories.sort(key=lambda x: x['score'], reverse=True)

selected = []
sub_count = {s: 0 for s in subs}
for story in stories:
    if sub_count[story['sub']] < args.per_sub_cap and len(selected) < args.limit:
        selected.append(story)
        sub_count[story['sub']] += 1

local_date = now_local.strftime('%Y-%m-%d')
print(f"# Reddit Macro & Markets Digest — {local_date} ({args.tz})")
print()
print(f"## Top {len(selected)} Stories (Past 24h)")
for i, story in enumerate(selected, 1):
    print(f"{i}. **{story['title']}** 📰 r/{story['sub']} ({story['score']:,}↑)")
    print(f"   {story['preview']}")
    print(f"   <{story['link']}>")
    print()