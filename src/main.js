import onChange from 'on-change';
import * as yup from 'yup';
import axios from 'axios';
import i18next from 'i18next';
import view from './view.js';
import ru from '../locales/ru.js';
import parseRss from './parser.js';

const postUpdateCheck = (state) => {
  const promises = state.urlList.map(({ feedId: id, url }) => {
    const updatedURl = `https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`;
    const request = axios.get(updatedURl);
    const parsedRss = parseRss(request);
    return parsedRss;
  });

  const promise = Promise.all(promises);

  promise.then((responses) => {
    responses.forEach((rss) => {
      console.log(rss);
      // const newPostList = rss.querySelectorAll('item');
      const newPostListElements = [];
      // newPostList.forEach((item) => {
      //   console.log(item);
      //   const postTitle = item.querySelector('title').textContent;
      //   if (!currentPostsTitles.includes(postTitle)) {
      //     const postDescription = item.querySelector('description').textContent;
      //     const link = item.querySelector('link').textContent;
      //     newPostListElements.push({ title: postTitle, description: postDescription, link });
      //   }
      // });
      return newPostListElements;
    });
    // return responses;
  });

  // state.urlList.forEach(({ feedId: id, url }) => {
  //   const updatedURl = `https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`;
  //   const request = axios.get(updatedURl);
  //   const parsedRss = parseRss(request);

  //   const currentPostsTitles = state.posts
  //     .reduce((acc, { feedId, elements }) => {
  //       if (feedId === id) {
  //         acc = [...acc, ...elements];
  //       }
  //       return acc;
  //     }, [])
  //     .map(({ title }) => title);

  //   parsedRss
  //     .then((rss) => {
  //       const newPostList = rss.querySelectorAll('item');
  //       const newPostListElements = [];
  //       newPostList.forEach((item) => {
  //         const postTitle = item.querySelector('title').textContent;
  //         if (!currentPostsTitles.includes(postTitle)) {
  //           const postDescription = item.querySelector('description').textContent;
  //           const link = item.querySelector('link').textContent;
  //           newPostListElements.push({ title: postTitle, description: postDescription, link });
  //         }
  //       });
  //       return newPostListElements;
  //     })
  //     .then((listOfNewPostElements) => {
  //       if (listOfNewPostElements.length !== 0) {
  //         state.posts.forEach((post) => {
  //           if (post.feedId === id) {
  //             post.elements = [...post.elements, ...listOfNewPostElements];
  //           }
  //         });
  //       }
  //     });
  // });
  // setTimeout(postUpdateCheck, 5000, state);
};

const app = () => {
  const initialState = {
    form: {
      process: {
        state: 'filling', // sending sent error
        error: null, // invalidLink noRss alreadyAdded
      },
      valid: null, // true false
    },
    urlList: [],
    feeds: [],
    posts: [],
    lastFeedId: 0,
  };

  const i18nInstance = i18next.createInstance();

  i18nInstance
    .init({
      lng: 'ru',
      resources: {
        ru,
      },
    })
    .then(() => {
      const state = onChange(initialState, view(initialState, i18nInstance));

      // postUpdateCheck(state);

      const form = document.querySelector('.rss-form');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        postUpdateCheck(state);
        const url = form.elements.url.value;

        const currentUrlList = state.urlList.map(({ url: urlElem }) => urlElem);

        const urlSchema = yup.object({
          url: yup.string().url('invalidLink').notOneOf(currentUrlList, 'alreadyAdded'),
        });

        const validation = urlSchema.validate({ url });

        const updetedURl = `https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`;
        const request = axios.get(updetedURl);
        const parsedRss = parseRss(request);

        const promises = Promise.all([validation, parsedRss]);

        state.form.process.state = 'sending';

        promises
          .then(([, rss]) => {
            const feedId = state.lastFeedId + 1;
            state.urlList.push({ feedId, url });
            state.lastFeedId = feedId;

            const feedTitle = rss.querySelector('title').textContent;
            const feedDescription = rss.querySelector('description').textContent;
            state.feeds.push({ id: feedId, title: feedTitle, description: feedDescription });

            const postList = rss.querySelectorAll('item');
            const postListElements = [];
            postList.forEach((item) => {
              const postTitle = item.querySelector('title').textContent;
              const postDescription = item.querySelector('description').textContent;
              const link = item.querySelector('link').textContent;
              postListElements.push({ title: postTitle, description: postDescription, link });
            });

            state.posts.push({ feedId, elements: postListElements });
            state.form.process.state = 'sent';
            state.form.valid = true;
          })
          .then(() => {
            state.form.process.state = 'filling';
            state.form.process.error = null;
            state.form.valid = null;
            // console.log(state);
          })
          .catch((error) => {
            state.form.process.error = error.message;
            state.form.process.state = 'error';
            state.form.valid = false;
          });
      });
    });
};

export default app;
