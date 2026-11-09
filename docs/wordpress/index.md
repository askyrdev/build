## Support for WordPress

Askyr Build provides additional features to support WordPress development. After following the installation
instructions, Askyr Build can be configured to support building the static assets for your theme and/or plugin.

## Adjusting the configuration

The first step to enabling additional support for WordPress is to specify the type in the configuration file within the
`AskyrBuild()` settings.

```js title="rspack.config.mjs"
import { defineConfig } from '@rspack/cli';
import AskyrBuild from '@askyr/build';

export default defineConfig( {
    entry: {
        'site-js': './assets/js/site.js',
        'site-style': './assets/css/site.css',
    },
    plugins: [
        new AskyrBuild( {
            type: 'wordpress',
            globals: [
                './assets/css/global/index.css',
            ],
        } ),
    ],
} );
```

This will provide rudimentary support for WordPress development. For example, we create the following as our `site.js`
file.

```js title="assets/js/site.js"
/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { __, _n, sprintf } from '@wordpress/i18n';

apiFetch( { path: '/wp/v2/posts' } ).then( ( posts ) => {
    if ( posts.length > 0 ) {
        console.log(
            sprintf(
                _n( '%d post found and we are using i18n, woohoo!', '%d posts found and we are using i18n, woohoo!', posts.length, 'askyr-build', posts.length )
            )
        );
    } else {
        console.log( __( 'No posts found :-( ... but it is using i18n', 'askyr-build' ) );
    }
} );
```

Once created, run the following terminal command.

```shell
npm run build
```

Askyr Build is intended, broadly, as a drop-in replacement for WordPress core's
[Dependency Extraction Webpack Plugin](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-dependency-extraction-webpack-plugin/).
This means that certain WordPress dependencies are replaced with global variables, with the intention that the Enqueue
library will include what it is necessary through the dependencies.

Askyr Build does two things; firstly, it replaces the imports syntax in the built JS files with the following.

* `winodw.wp.apiFetch` used in place of `@wordpress/api-fetch`.
* `window.wp.i18n.*` used in place of `@wordpress/i18n`.

Secondly, the `dist/assets.json`, will list the dependencies with a naming convention compatible with
`wp_enqueue_scripts()`. It would contain the following (a truncated version of the `assets.json` file output - note the
`"dependencies"` array).

```json
[
  {
    "id": "site-js",
    "chunk": "initial",
    "filename": "site-js.js",
    "type": "javascript",
    "dependencies": [
      "wp-i18n",
      "wp-api-fetch"
    ],
    "meta": {}
  }
]
```

## Documentation

* [Enqueuing assets](/docs/wordpress/enqueuing.md)
* [Blocks](/docs/wordpress/blocks.md)
* [Adding Subresource Integrity to JS enqueues](/docs/wordpress/subresource-integrity.md)