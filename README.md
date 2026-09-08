# Askyr Build

An rspack plugin that provides manifest output management and compatibility with WordPress, similar to Dependency
Extraction Webpack plugin.

* Includes PostCSS setup and support.
* WordPress dependency extraction support, converting `@wordpress/` to `window.wp[]` equivalents, without needing 
Webpack.
* Outputs an `assets.json` with [subresource integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Subresource_Integrity) hashes for each CSS and JS asset.

## Installation

Install rspack CLI.

```shell
npm install --save-dev @rspack/cli
```

Install Askyr Build. **Please note;** this project is currently in development and not recommended for production use 
outside Askyr projects.

```shell
npm install --save-dev --allow-git=root github:askyrdev/build
```

Then add the `rspack build` to the scripts.

```json
{
  "name": "my-project",
  "devDependencies": {
    "@askyr/build": "github:askyrdev/build",
    "@rspack/cli": "^2.2.1"
  },
  "scripts": {
    "build": "rspack build"
  }
}
```

## Example `rspack.config.mjs` for atypical WordPress

This can be used for either a custom plugin or theme with the following structure.

* [root]
  * dist/
  * includes/
    * blocks/
    * classes/
  * composer.json
  * composer.lock
  * package.json
  * package-lock.json
  * rspack.config.mjs

```javascript
import { defineConfig } from '@rspack/cli';
import AskyrBuild from '@askyr/build';

export default defineConfig( {
    // Define the regular CSS and JavaScript, like regular `rspack`.
    entry: {
        'site-js': './assets/js/site.js',
        'site-style': './assets/css/site.css',
    },
    plugins: [
        // Add the AustereBuild to the plugins.
        new AskyrBuild( {
            // Specify the type of project you are working on.
            type: 'wordpress',
            // Optionally add metadata to `assets.json` output, useful for server-side logic.
            assetMeta: {
                'block-editor': {
                    'enqueue': 'admin',
                },
            },
            // Specify global CSS files, such as variables and media rules.
            globals: [
                'assets/css/global/index.css',
            ],
            // WordPress-only
            // Specify the folder(s) which include custom blocks.
            blocks: {
                main: 'includes/blocks',
            },
        } ),
    ],
});
```

## Options

### type

Specify the type of project that is being used with Askyr Build. Defaults to `'non-specific'`.

* `non-specific` - use for generic/vanilla JavaScript projects.
* `wordpress` - adds support for WordPress dependencies (`@wordpress/*`) and custom Blocks.

### assetMeta

Add metadata to the `assets.json` output file which can be used with the server-side logic. The key must match the key
used on `entry: {}` in rspack.

### blocks

A list of directories containing custom blocks to be processed by Askyr Build. Expects the directory to be structured as
`<blocks-directory>/<block-name>/block.json`

See; https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/.

### copyExtensions

Defaults to; jpg, jpeg, png, gif, svg, ttf, woff, woff2, otf.

File extensions supported for copying files from a directory to the `outputDir` through the `CopyRspackPlugin()`.
Applies to both the source folders and `blocks`.

Example of the configuration used by Askyr Build.

```javascript
/**
 * Move other static assets, such as images and fonts.
 */
{
    from: `**/*.{${supportedExtensions}}`,
    context: 'assets/',
    noErrorOnMissing: true,
    to: '[path][name][ext]',
}
```

### copyPatterns

Provide custom additional patterns to the `CopyRspackPlugin()` plugin to those from Askyr Build.

See; https://rspack.rs/plugins/copy-rspack-plugin.

### globalFiles

An array of relative paths for CSS files to be specified for the `@csstools/postcss-global-data` plugin.

See; https://www.npmjs.com/package/@csstools/postcss-global-data.

### outputDir

Default; dist/.

A path relative to the `rspack.config.mjs` directory where the build assets are to be outputted.

### rules

Enables the ability to toggle off predefined rules for rspack `module.rules` provided by Askyr Build. Useful for
projects with custom requirements.

Default values are;

```javascript
rules: {
  asset: true,
  css: true,
  javascript: true,
  json: true,
}
```

See; https://rspack.rs/config/module-rules.

## Common issues

If you see a message such as this;
```
[MODULE_TYPELESS_PACKAGE_JSON] Warning: Module type of rspack.config.js is not specified and it doesn't parse as CommonJS.
Reparsing as ES module because module syntax was detected. This incurs a performance overhead.
To eliminate this warning, add "type": "module" to package.json.
```
Change the rspack configuration file extension from `.js` to `.mjs` or change the `package.json` to include
`"type": "module"` (if appropriate for your project).