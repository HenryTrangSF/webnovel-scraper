# Webnovel Scraper

This script utilizes puppeteer to navigate through Web Novel to get all the free chapters and posts them onto a Ghost blog utilizing the Ghost Admin API.

## How to use

Set up a Ghost blog and get your Admin API key to put in the `.env` file.

Edit the `novel.json` with a novel of your choice (i.e. True Martial World). Use QU to grab all the premium chapters. Use this to post onto your Ghost blog.

```
{
  "title": "True Martial World",
  "url": "https://www.webnovel.com/book/7834185605001405",
  "slug": "TMW",
  "ulChild": 935
}
```

To start the script, use the command `npm run post`
