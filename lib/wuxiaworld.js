const puppeteer = require('../node_modules/puppeteer');
const ghost = require('../node_modules/@tryghost/admin-api');
const novel = require('../novel');
const publish = require('./publish');
const utilities = require('./utilities');

// Ghost Admin API credentials
const api = new ghost({
  url: process.env.GHOST_API_URL,
  key: process.env.GHOST_ADMIN_API_KEY,
  version: 'v2'
});

exports.post = async function wuxiaworld() {

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await console.log('Navigating to ' + novel.title + ' on WuxiaWorld');
  await page.goto(novel.url);
  // WIP
}
