'use strict';

const Router = require('koa-router');
/** @type {Router} */
const router = new Router();

router
  .get('/', async (context) => {
    const {
      filter: username,
    } = context.query;

    try {
      context.body = await context.state.jiraClient.user.search({ username });
    } catch (error) {
      context.throw(500, 'Jira error', { isJira: true, original: error });
    }
  });

/** @type {Router} */
module.exports = router;
