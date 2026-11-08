# Installation

> [!NOTE]
> As Askyr Build is still in beta, this library is only available via git.

## Installing NPM dependencies

Install Rspack CLI and Askyr Build.

```shell
npm install --allow-git=root --save-dev @rspack/cli github:askyrdev/build
```

## Configuration File

Once the libraries have been installed, it's time to create your configuration file. At an absolute minimum, you need to
define the entry points for your CSS and JavaScript and include the Askyr Build plugin.

```js title="rspack.config.mjs"
import { defineConfig } from '@rspack/cli';
import AskyrBuild from '@askyr/build';

export default defineConfig( {
    entry: {
        'site-js': './assets/js/site.js',
        'site-style': './assets/css/site.css',
    },
    plugins: [
        new AskyrBuild(),
    ],
} );
```

Out of the box, this will provide a baseline configuration for building applications with JavaScript and PostCSS. If the
application you are constructing has multiple CSS entry's and exits, you may want to configure a global to reshare
common styles across your application such as.

This can be accomplished by specifying the globals setting within `AskyrBuild()`.

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
            globals: [
                './assets/css/global/index.css',
            ],
        } ),
    ],
} );
```

## Updating the package.json

Now we have a configuration and the dependencies install, it's time to update the `package.json` to provide the scripts
to use the new build process.

```json
{
  "scripts": {
    "build": "rspack build"
  }
}
```

The full example of a `package.json` file for Askyr Build is shown below.

```json
{
  "name": "askyr-build-example",
  "version": "1.0.0",
  "description": "This is an example project Package JSON for explaining Askyr Build.",
  "license": "GPL-2.0-only",
  "author": "Joe Blogs",
  "scripts": {
    "build": "rspack build"
  },
  "devDependencies": {
    "@askyr/build": "github:askyrdev/build",
    "@rspack/cli": "^2.1.10"
  }
}
```

Once created, run the following terminal command.

```shell
npm run build
```

## CMS Support

This will cover most applications which wish to use a separate build process for CSS and JavaScript with a separate
backend. However, Askyr Build also provides additional functionality for the following;

* Drupal
* [WordPress](/wordpress/index.md)

## Additional reading:
- https://postcss.org
- [PostCSS Global Data](https://www.npmjs.com/package/@csstools/postcss-global-data)
- [PostCSS Mixins](https://www.npmjs.com/package/postcss-mixins)
- [PostCSS Preset Env](https://www.npmjs.com/package/postcss-preset-env)
- [Configure Rspack](https://rspack.rs/config/)
