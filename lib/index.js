const puppeteer = require('../node_modules/puppeteer');
const novel = require('../novel');
const webnovel = require('./webnovel');
const utilities = require('./utilities');
const publish = require('./publish');


(async () => {

  const browser = await puppeteer.launch();

  await console.log('Welcome to Novel Scraper' + '\n \n' + 'This program has been created with love and care by Pyon. If you have any questions, comments, or concerns, feel free to reach out to be on Discord at @Pyon#8888' + '\n');
  await utilities.sleep(5000);
  await console.log('The novel scrapper will now run');

  // Check to see if there is a tag already made for the novel, if not, make a tag
  publish.checkNovel();

  if (novel.url.indexOf('webnovel') >= 0) {

    await console.log(novel.title + ' has been found on Webnovel, launching Chromium');
    await webnovel.post();
    if (novel.ulChild >= 0) {

      await console.log(novel.title + ' has been found on Qidian Underground');
      await webnovel.postUnderground();

    }

  }

  else {

    console.log('This novel is not currently supported at this time');

  }

  await console.log('All chapters have been successfully published' + '\n');
  await utilities.sleep(2500);
  await console.log('Exiting Chromium' + '\n');
  await utilities.sleep(2500);
  await browser.close();

})();
