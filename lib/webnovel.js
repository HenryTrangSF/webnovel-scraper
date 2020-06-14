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

const qidianUndergroundHref = 'https://toc.qidianunderground.org/';
const ulChild = novel.ulChild

exports.post = async function webnovel() {

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Load the webpage -> Go to Table of Contents
  await console.log('Navigating to ' + novel.title + ' on Webnovel');
  await page.goto(novel.url)
  await console.log('Checking the Table of Contents');
  await page.click('a[data-for=\"#contents\"]');
  await page.waitFor('.volume-item');

  // Fetch the links of all free chapters
  await console.log('Fetching the links of all free chapters in ' + novel.title);
  let tableOfContents = await page.evaluate(() => {

    let TOC = document.querySelectorAll('.volume-item a');
    let chapterArray = [];

    // Push all free chapters into an array
    for (let i = 0; i < TOC.length; i++) {

      let href = TOC[i].getAttribute('href');

      if (TOC[i].children.length < 3) {
        chapterArray.push('https:' + href);
        console.log('Pushing https:' + href);
      }
      else if (TOC[i].children.length === 3) {
        console.log('No more free chapters')
        break;
      }

    }

    console.log('All free chapters have successfully been fetched!');
    return chapterArray;

  });

  // Navigate to each free chapter and publish its contents to Ghost
  for (let i = 0; i < tableOfContents.length; i++) {

    // Navigate to the chapter
    await console.log('Navigating to \"' + tableOfContents[i] + '\"');
    await Promise.all([
      page.waitFor('.cha-words'),
      page.goto(tableOfContents[i])
    ]);

    chapter = await page.evaluate(() => {

      let regex = /<p><\/p>|\<p>\s*<\/p>|<pirate>\s*.*\s*<\/pirate>|\s+\s|<br>/gm;
      let title = document.querySelector('.cha-tit > *:nth-of-type(1)').innerText;
      let chapterHTML = document.querySelector('.cha-words');
      let content = chapterHTML.innerHTML.replace(regex, '');

      let chapterContent = [{
        title: title,
        content: content
      }];

      return chapterContent

    });

    // Publish the chapter
    publish.post();

  }

  await console.log(novel.title + ' has successfully been published from Webnovel')

}

exports.postUnderground = async function qidianUnderground() {
  // If novel exists in Qidian Underground, fetch the chapters from there
  const browser = await puppeteer.launch({headless:false});
  const page = await browser.newPage();

  // Load Qidian Underground
  await console.log('Novel has been found on Qidian Underground');
  await Promise.all([
    console.log('Now navigating to Qidian Underground'),
    page.waitFor('#page > small'),
    page.goto(qidianUndergroundHref)
  ]);

  // Fetch all the chapter URLs of the novel
  await console.log('Searching for ' + novel.title + ' to fetch the Table of Contents');
  let tableOfContents = await page.evaluate((ulChild) => {

    let TOC = document.querySelectorAll('ul:nth-child(' + ulChild + ') a');
    let chapterArray = [];

    // Push all the URLs into an array
    for (let i = 0; i < TOC.length; i++) {

      chapterArray.push(TOC[i].getAttribute('href'));

    }

    return chapterArray;
  }, ulChild);

  await console.log('All chapter links have been fetched on Qidian Underground');

  await console.log('Preparing all available chapters to publish on Ghost');

  // Fetch and publish the chapters
  for (let m = 0; m < tableOfContents.length; m++) {

    await Promise.all([
      await console.log('Navigating to \"' + tableOfContents[m] + '\"'),
      await page.goto(tableOfContents[m]),
      await page.waitFor('.well')
    ])

    // Fetch each chapter and and add it to the array
    chapter = await page.evaluate(() => {

      let selector = '.input-group.text-justify.center-block.col-md-8.col-md-offset-2 > .well';
      let regex = /\<p><br><br><\/p>|<br>|\<p><\/p>|\<p>TL:(.*?)<\/p>|\\n|<h2\b[^>]*>(.*?)<\/h2>|<\/h2>|\\|\r?\n|\<div(.*?)div>|\r/gm;
      let title = document.querySelectorAll(selector + ' > h2.text-center');
      let chapterHTML = document.querySelectorAll(selector);
      let chapterArray = [];

      // Put all the chapters in each link into an array
      for (let y = 0; y < title.length; y++) {

        let content = chapterHTML[y].innerHTML.replace(regex, '');
        console.log('Putting chapter into the array');
        chapterArray[y] = {
          title: title[y].innerText,
          content: content
        };

      }

      return chapterArray;

    })

    // Because every page in Qidian Underground consists of multiple chapters, we're going to publish them as we visit each page
    for (let x = 0; x < chapter.length; x++) {

      // Convert HTML into a mobiledoc readable format
      let mobiledoc = JSON.stringify ({
        version: '0.3.1',
        markups: [],
        atoms: [],
        cards: [['html', {cardName: 'html', html: chapter[x].content}]],
        sections: [[10, 0]]
      });

      // Chapter post information
      let post = {
        title: chapter[x].title,
        mobiledoc: mobiledoc,
        tags: [novel.title],
        status: 'published'
      }

      // Publish chapters to Ghost, without checking if the chapter has already been published
      await api.posts
        .add(post)
        .then(response => {
          console.log(response);
          console.log(novel.title + ' – ' + chapter[x].title + ' has been successfully published!');
        })
        .catch(error => {
          console.error(error);
        })

      await utilities.sleep(1000);

    }

  }

}
