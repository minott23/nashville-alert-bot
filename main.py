import feedparser
import requests
import time
import json
import os

# =========================
# CONFIG
# =========================

BOT_TOKEN = "8681803290:AAGO-gOAKIpna4lMOPJc2E68K69ms_ldP0Y"
CHAT_ID = "6861173382"
CHECK_INTERVAL = 600  # 10 minutes

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
# MAIN LOOP
# =========================

while True:
    for feed_url in RSS_FEEDS:
        feed = feedparser.parse(feed_url)

        for entry in feed.entries:
            link = entry.link

            if link in sent_links:
                continue

            message = f"""📰 New Article

{entry.title}

{link}
"""
            send_message(message)

            sent_links.append(link)

            with open(SENT_FILE, "w") as f:
                json.dump(sent_links, f)

    time.sleep(CHECK_INTERVAL)