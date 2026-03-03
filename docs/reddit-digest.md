# Reddit Macro & Markets Digest Automation

Daily automation that posts the top 5 Reddit threads (past 24h) covering economics, equities, small caps, world news, AI, and crypto.

## Components

| Piece | Path / ID | Notes |
| --- | --- | --- |
| Data fetcher | `scripts/daily_reddit_digest.py` | Python script that queries Reddit's public JSON endpoints, filters by topic list, deduplicates, caps per-subreddit representation, and renders a clean Markdown digest. |
| Python deps | `requirements.txt` | Currently just `requests`. |
| Cron job | `reddit-daily-macro-digest` (`19626c4f-5133-4411-99a9-98919cfe1f65`) | Runs daily at 07:30 Europe/Vienna. Executes the script and ships the digest to Telegram chat `6113726084`. |

## Script usage

```bash
# 1) Install deps once (optional virtualenv recommended)
pip3 install -r requirements.txt

# 2) Run the generator
python3 scripts/daily_reddit_digest.py \
  --limit 5 \
  --per-subreddit 25 \
  --per-sub-cap 2 \
  --tz Europe/Vienna
```

Flags:
- `--subreddits`: override the curated list (default: economics, stocks, worldnews, MachineLearning, cryptocurrency, smallcapstocks, investing, RocketLab).
- `--limit`: number of stories to output (default 5).
- `--per-subreddit`: how deep to pull from each subreddit (default 20).
- `--per-sub-cap`: final per-subreddit cap to keep the mix balanced (default 2).
- `--json`: emit structured JSON instead of Markdown (handy for debugging/other surfaces).

The script prints Markdown and never hits Reddit's API keys—only the public JSON endpoints.

The script was refreshed on 2026-02-27 for a cleaner Telegram look:

- Cards open with bold subreddit emojis + 2-digit indices for easy scanning.
- Vote/comment counts render as literal badges (e.g. `[⬆️ 12.4k] [💬 980]`).
- A pastel gradient score bar (🩵🩷💜…) shows relative heat vs. the top post, capped at eight glyphs to keep lines <80ch.
- Posts with ≥10k upvotes receive a bold `HOT` tag inline with the stats row.
- Snippets are wrapped to 74 characters with generous padding, giving Telegram a white-card feel.
- Links now use the compact `https://redd.it/<id>` format to prevent long lines from wrapping strangely.

## Cron automation (OpenClaw)

```
Name:        reddit-daily-macro-digest
ID:          19626c4f-5133-4411-99a9-98919cfe1f65
Schedule:    30 7 * * *   (tz: Europe/Vienna)
Session:     isolated (agent: francine)
Payload:     Run `python3 scripts/daily_reddit_digest.py --limit 5 --per-subreddit 25 --per-sub-cap 2 --tz Europe/Vienna`
Delivery:    message tool ➜ Telegram chat 6113726084 (Markdown)
Alert path:  Sends ⚠️ notification to the same chat if the script errors
```

### Managing the job

```bash
# Inspect job (JSON)
openclaw cron list --json | jq '.jobs[] | select(.id=="19626c4f-5133-4411-99a9-98919cfe1f65")'

# Run immediately for debugging
openclaw cron run 19626c4f-5133-4411-99a9-98919cfe1f65

# Edit message/flags
openclaw cron edit 19626c4f-5133-4411-99a9-98919cfe1f65 --message "..."
```

## Failure handling

If the Python script exits non-zero (network issues, parsing failures, etc.), the cron instructions send a ⚠️ message to Telegram and stop. Check `openclaw cron runs 19626c4f-...` and `openclaw gateway logs -f` for stack traces.

## Manual delivery checklist

1. `python3 scripts/daily_reddit_digest.py --limit 5 > /tmp/reddit.md`
2. Review `/tmp/reddit.md` (under 3,500 chars).
3. `openclaw message send --channel telegram --target 6113726084 --message "$(cat /tmp/reddit.md)" --parse-mode Markdown`
