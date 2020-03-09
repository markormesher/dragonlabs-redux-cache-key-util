# @dragonlabs/redux-cache-key-util

This util provides a very lightweight way to check the validity of inter-dependent cache entries, such that the validity of a cache entry is dependent on whether other entries have been updated since it was set. It does *not* currently support TTL-based validity checking.

The set of operations supported is very simple:

* A cache key can be updated, indicating that the value cached for that key has been upated.
* A cache key can be invalidated, indicating that the value cached for that key is no longer valid.
* The validity of a cache key can be checked. A key is considered valid if both of the following conditions are true:
  * The key has been updated at some time `t`.
  * No dependent key has been updated at any point since `t`.

Note that the update and invalidate methods do not update this util's state directly; rather, they produce action that should be dispatched just like any other Redux action. This makes the util easy to use alongside any other part of your code that interacts with Redux.

## Installation and Usage

Install with yarn:

    yarn add -D @dragonlabs/redux-cache-key-util

Or install with NPM:

    npm install --save-dev @dragonlabs/redux-cache-key-util

Pass your Redux store to the `setStore(store: Store)` method in the initialisation steps of your app:

    import React from "react";
    import * as ReactDOM from "react-dom";
    import { createStore } from "redux";
    import { App } from "./components/App/App";
    import { CacheKeyUtil } from "@dragonlabs/redux-cache-key-util";

    const store = createStore(
      // your reducers, middleware, etc.
    );

    CacheKeyUtil.setStore(store);

    ReactDOM.render(
      <YourApp />,
      document.getElementById("root"),
    );

Use the `updateKey(key: string)` and `keyIsValid(key: string, dependencies: string[] = [])` methods to track whether cache keys are valid. A common usage is deciding whether to read data from your cache or pull it from your API. Note that dependencies don't necessarily have to correspond to cache entries; in this example we update a key every time an article comment it updated, then use it as a dependency when deciding whether to reload the full view of the article.

    async function maybeReloadFullArticle(articleId: string) {
      const cacheKey = "full_article_" + articleId;
      const commentUpdateKey = "article_comment_updated_" + articleId;

      if (CacheKeyUtil.keyIsValid(cacheKey, [commentUpdateKey])) {
        return;
      }

      const fullArticle = await loadFullArticleFromApi(articleId);
      dispatch({ type: "full_article_loaded", is: articleId, article: fullArticle });
      dispatch(CacheKeyUtil.updateKey(cacheKey));
    }

## Internal Use of Timestamps

When a key is updated, a timestamp is stored for that key. Validity of a key is checked by comparing its timestamp to the timestamps of any dependent keys.

Timestamps are issued interally as strictly increasing non-repeating integers that may or may not reflect the actual wall-clock timestamp. The minimum valid timestamp is 0; any value below 0 indicates an invalid key.

## Why "dragonlabs"?

It was late and I needed a name. DragonLabs is a reference to an old project and was the first thing that came to mind.
