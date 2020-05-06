require("dotenv").config();

const ghost = require('../node_modules/@tryghost/admin-api');
const novel = require('../novel');
const utilities = require('./utilities');

const sleepTime = 1000;

// Ghost Admin API credentials
const api = new ghost({
  url: process.env.GHOST_API_URL,
  key: process.env.GHOST_ADMIN_API_KEY,
  version: 'v2'
});

async function addPost(x = 0) {

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

  await utilities.sleep(sleepTime);

}

async function newNovel() {

  // Add the tag for the new novel
  await console.log('Adding tag for the new novel');
  await api.tags
    .add({
      name: novel.title,
      slug: novel.slug
    })
    .then(response => {
      console.log(response);
      console.log(novel.title + ' has been added to tags');
    })
    .catch(error => {
      console.error(error);
    })

}

exports.post = async function postWithoutCheck(x = 0) {

  // Adds chapters without checking whether or not they've been posted yet (Use with new novels)
  await addPost(x);

}

exports.update = async function postWithCheck(x = 0) {

  await api.posts
    // Browse all the posts within the tag
    .browse({
      filter: 'primary_tag:' + novel.slug,
      limit: 'all',
      order: 'published_at ASC'
    })

    .then(response => {
      // Check to see if the chapter has been posted yet
      let boolean = false;

      for (let n = 0; n < response.length; n++) {
        if (response[n].title === chapter[x].title) {
          boolean = true;
        }
      }

      // If the chapter has not been published yet, publish the chapter
      if (boolean === false) {

        addPost(x)

      }

      // If the chapter has already been published, skip the chapter
      else {

        console.log('Chapter has already been published, skipping chapter');
        utilities.sleep(sleepTime);

      }
    })

    .catch(error => {
      console.error(error);
    })

}

exports.checkNovel = function checkNovel() {

  // Checks to see if the novel has been added to the tags yet
  api.tags
    // Browse all available tags
    .browse({
      limit: 'all'
    })
    .then(response => {

      let post = response;

      // Checks to see if a tag has been created with the same name as the novel title
      let boolean = false;

      for (let n = 0; n < post.length; n++) {
        if (post[n].name === novel.title) {
          boolean = true;
        }

      }

      // If a novel has not yet been added to the list of novels, publish all chapters without running checks
      if (boolean === false) {

        console.log(novel.title + ' has not yet been added, adding novel');
        utilities.sleep(5000);
        newNovel();

      }

      else {
        return;
      }

    })
    .catch(error => {
      console.log(error);
    })

}
