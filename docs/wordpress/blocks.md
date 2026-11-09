# Blocks

Askyr Build also provides support for Blocks/Gutenberg editor used in WordPress. This is primarily provided by the
ability to parse the `block.json`, which is a standardised format from WordPress core itself to simplify registering
blocks for a WordPress install.

Read more here, https://developer.wordpress.org/block-editor/getting-started/fundamentals/block-json/.

## Supported Structures

WordPress blocks are supported in the following folder structure. Essentially, blocks are placed into their own folder
with a subfolder per each custom block to be included.

* [plugin-or-theme]
  * `rspack.config.mjs` <-- this is referenced later and paths are relative to this file. 
  * relative-path/
    * to/ 
      * blocks/
        * example/
          * block.json
          * _[supporting assets]_
        * custom-block-two/
          * block.json
          * _[supporting assets]_
  * functions.php 

## Configuring for Blocks support

By default, Askyr Build does not provide support directly for WordPress blocks (not all plugins, for example, need to
add their own blocks). This needs to be specified using the `blocks: {}` setting to Askyr Build.

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
            blocks: {
                // Specify the relative path(s) for where blocks.
                // Essentially, `glob.sync( `relative-path/to/blocks/**/block.json` );`
                'main': 'relative-path/to/blocks',
            },
        } ),
    ],
} );
```

The following is a basic Example block, used in the unit test for Askyr Build, based on the documentation from
WordPress; https://developer.wordpress.org/block-editor/getting-started/fundamentals/block-json/.

```json
{
  "$schema": "https://schemas.wp.org/trunk/block.json",
  "apiVersion": 3,
  "title": "Example Block",
  "description": "An Example Block",
  "textdomain": "askyrbuild",
  "name": "askyrbuild/example",
  "icon": "feedback",
  "category": "formatting",
  "attributes":{
    "title": {
      "type" : "string"
    }
  },
  "example": {
    "attributes":{
      "title": "Example Block"
    }
  },
  "supports": {
    "html": false
  },
  "editorScript": "file:./index.js",
  "viewStyle": "file:./view.css",
  "viewScript": "file:./viewScript.js"
}
```

> [!NOTE]
> Scripts and styles need to have unique names, otherwise it can lead to unexpected behaviour and/or outputs.
> ```json
> {
>   "editorScript": "file:./editorScript.js",
>   "editorStyle": "file:./editorStyle.css",
>   "viewScript": "file:./viewScript.js"
>   "viewStyle": "file:./viewStyle.css",
> }
> ```

## Registering custom blocks

```php
/**
 * Retrieve the block definitions from the built/output folder from Askyr Build.
 */
$blocks = glob( get_template_directory() . '/dist/blocks/**/block.json' );
foreach ( $blocks as $block_json ) {
    /**
     * If using a form of dynamic block output, then add the logic here for `$args["render_callback"]` key.
     */
    register_block_type_from_metadata( $block_json );
}
```
