import feedparser
import requests
import time
import json
import os

# =========================
# CONFIG
# =========================

BOT_TOKEN = "8681803290:AAGO-gOAKIpna4lMOPJc2E68K69ms_ldP0Y"
CHAT_ID = "6861173382"  # Your Telegram numeric ID
CHECK_INTERVAL = 600  # 10 minutes

EVENT_KEYWORDS = [
    "shooting", "stabbing", "arrest", "police",
    "fire", "crash", "robbery", "investigation",
    "breaking", "storm", "tornado", "flood",
    "governor", "bill", "election"
]

LOCATION_KEYWORDS = [
    "east nashville", "downtown nashville", "germantown",
    "the nations", "antioch", "donelson", "hermitage",
    "madison", "bellevue", "12 south",
    "wedgewood houston", "green hills",
    "north nashville", "south nashville",
    "sylvan park", "west nashville",
    "bordeaux", "edgehill"
]

RSS_FEEDS = [
    "https://www.wsmv.com/rss",
    "https://fox17.com/rss",
    "https://www.newschannel5.com/rss",
    "https://www.wkrn.com/feed/",
    "https://www.tennessean.com/rss/",
    "https://nashvillepost.com/feed/",
    "https://www.axios.com/local/nashville/rss.xml",
    "https://www.nashvillescene.com/rss",
    "https://www.nashville.gov/departments/communications/news/rss.xml",
    "https://www.tn.gov/governor/news.html?format=rss"
]

SENT_FILE = "sent_links.json"

# =========================
# LOAD SENT LINKS
# =========================

if os.path.exists(SENT_FILE):
    with open(SENT_FILE, "r") as f:
        sent_links = json.load(f)
else:
    sent_links = []

# =========================
# TELEGRAM FUNCTION
# =========================

def send_message(text):
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": CHAT_ID,
        "text": text,
        "disable_web_page_preview": False
    }
    requests.post(url, data=payload)

# =========================
# TEST MESSAGE (REMOVE AFTER CONFIRMATION)
# =========================

send_message("🚨 Test Alert\n\nTitle of Article\nhttps://example.com")

# =========================
# KEYWORD MATCH FUNCTION
# =========================

def matches_keywords(text):
    text = text.lower()
    event_match = any(word in text for word in EVENT_KEYWORDS)
    location_match = any(word in text for word in LOCATION_KEYWORDS)
    return event_match and location_match

# =========================
# MAIN LOOP
# =========================

while True:
    for feed_url in RSS_FEEDS:
        feed = feedparser.parse(feed_url)

        for entry in feed.entries:
            link = entry.link

            if link in sent_links:
                continue

            content = entry.get("title", "") + entry.get("summary", "")

            if matches_keywords(content):
                message = f"""🚨 Keyword Match

{entry.title}

{link}
"""
                send_message(message)

                sent_links.append(link)

                with open(SENT_FILE, "w") as f:
                    json.dump(sent_links, f)

    time.sleep(CHECK_INTERVAL)