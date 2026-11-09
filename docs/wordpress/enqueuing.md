# Enqueuing build assets in WordPress

When the build process is run, the `dist/` folder will contain an `assets.json` file which includes a list of all the
build outputs. For in developing plugins and/or themes for WordPress, this will need to be "enqueued" to be made
available.

## Using `assets.json`

The assets output file is a manifest of your static assets passed through rspack + Askyr Build. Therefore, the first
step is to retrieve this file in PHP.

```php
/** For plugins main file, such as `myplugin/myplugin.php`. */
define( 'MY_PLUGIN_PATH', plugin_dir_path( __FILE__ ) );

/** For themes, usually in `functions.php`. */
define( 'MY_THEME_PATH', get_template_directory() );

/**
 * Enqueue assets used for the theme.
 *
 * @return void
 */
function enqueue_assets() {
    /**
     * Note: the `associated` is optional and down to preference.
     */
    $assets = wp_json_file_decode( MY_THEME_PATH, [ 'associative' => true ] );
    if ( empty( $assets ) ) {
        return false;
    }

    foreach ( $assets as $asset ) {
        // enqueue here
    }
}
add_action( 'wp_enqueue_scripts', 'enqueue_assets' );
```

Once the assets are loaded, the first step is to distinguish the file types that are to be enqueued. Primarily, this
will be to handle CSS and JavaScript, which are enqueued with different functions.

The following is the basic needed to enqueue the built CSS and JavaScript from rspack + Askyr Build, and is applicable
for most setups.

```php title="functions.php"
function enqueue_assets() {
    $assets = wp_json_file_decode( MY_THEME_PATH, [ 'associative' => true ] );
    if ( empty( $assets ) ) {
        return false;
    }

    foreach ( $assets as $asset ) {
        /**
         * Do not enqueue the block-specific assets.
         */
        if ( str_starts_with( $asset['filename'], 'blocks/' ) ) {
            continue;
        }
    
        $asset_url = sprintf( '%sdist/%s', get_template_directory_uri(), $asset['filename'] );
    
        if ( 'css' === $asset['type'] ) {
            wp_enqueue_style( sanitize_title( $asset['id'] ), $asset_url, [], $asset['version'] );
        } elseif ( 'javascript' === $asset['type'] ) {
            wp_enqueue_style(
                sanitize_title( $asset['id'] ),
                $asset_url,
                $asset['dependencies'],
                $asset['version'],
                [
                    'in_footer' => true,
                    'strategy'  => 'async',
                ]
            );
        }
    }
}
add_action( 'wp_enqueue_scripts', 'enqueue_assets' );
```

## Adding extra options

Askyr Build provide the ability to insert additional information into the `assets.json` at build time, which can then be
used to adjust/extend logic within PHP. Using the previous example, we will include additional metadata so that we can
specify the `$args` parameter within the configuration.

First, we need to update the rspack configuration as follows;

```js title="rspack.config.mjs"
import { defineConfig } from '@rspack/cli';
import AskyrBuild from '@askyr/build';

export default defineConfig( {
    entry: {
        'site-js': './assets/js/site.js', // Make sure the name match.
        'site-style': './assets/css/site.css',
    },
    plugins: [
        new AskyrBuild( {
            assetMeta: {
                'site-js': { // Make sure the name match.
                    'args': { // Specify `$args` keys and values; https://developer.wordpress.org/reference/functions/wp_enqueue_script/
                        'in_footer': true,
                        'strategy': 'async',
                    },
                },
            },
            globals: [
                './assets/css/global/index.css',
            ],
        } ),
    ],
} );
```

After this change, re-run the `npm run build`, and the `assets.json` will incorporate the supplied `assetMeta` into the
`meta` key per section.

```php title="functions.php"
function enqueue_assets() {
    $assets = wp_json_file_decode( MY_THEME_PATH, [ 'associative' => true ] );
    if ( empty( $assets ) ) {
        return false;
    }

    foreach ( $assets as $asset ) {
        /**
         * Do not enqueue the block-specific assets.
         */
        if ( str_starts_with( $asset['filename'], 'blocks/' ) ) {
            continue;
        }
    
        $asset_url = sprintf( '%sdist/%s', get_template_directory_uri(), $asset['filename'] );
    
        if ( 'javascript' === $asset['type'] ) {
            wp_enqueue_style(
                sanitize_title( $asset['id'] ),
                $asset_url,
                $asset['dependencies'],
                $asset['version'],
                $asset['meta']['args'] ?? [], // Map the new `assetMeta` to the relevant argument.
            );
        }
    }
}
add_action( 'wp_enqueue_scripts', 'enqueue_assets' );
```

## JavaScript Dynamic Imports

A technique within modern JavaScript that can be used to reduce initial load and loading logic/scripts only when needed
is "dynamic imports". For example;

```js title="importee.js"
const exampleFn = () => {
    // logic here
}

export default exampleFn();
```

And this dynamically imported using the following;

```js title="importer.js"
if ( document.body.classList.contains( 'post-type-archive-product' ) ) {
    import( './importee' ).then( ( module ) => module.default() );
}
```

This requires additional logic when enqueuing scripts in WordPress, as these should be skipped. However, they are
included within `assets.json` for completeness. These can be identified by looking at the `chunk` property and the value
`async`.

```php title="functions.php"
function enqueue_assets() {
    $assets = wp_json_file_decode( MY_THEME_PATH, [ 'associative' => true ] );
    if ( empty( $assets ) ) {
        return false;
    }

    foreach ( $assets as $asset ) {
        /**
         * Do not enqueue the block-specific assets.
         */
        if ( str_starts_with( $asset['filename'], 'blocks/' ) ) {
            continue;
        }
    
        $asset_url = sprintf( '%sdist/%s', get_template_directory_uri(), $asset['filename'] );
    
        if ( 'javascript' === $asset['type'] ) {
            /**
             * This will ensure that `importee.js` is passed into `wp_enqueue_script()` and is handled dynamically by
             * JavaScript.
             */
            if ( 'async' === $asset['chunk'] ) {
                continue;
            }
            
            wp_enqueue_style(
                sanitize_title( $asset['id'] ),
                $asset_url,
                $asset['dependencies'],
                $asset['version'],
                $asset['meta']['args'] ?? [], // Map the new `assetMeta` to the relevant argument.
            );
        }
    }
}
add_action( 'wp_enqueue_scripts', 'enqueue_assets' );
```

## Additional Reading

* [register_block_type_from_metadata](https://developer.wordpress.org/reference/functions/register_block_type_from_metadata/) on WordPress Developer Resources.
* wp_enqueue_script on WordPress Developer Resources.
* wp_enqueue_style on WordPress Developer Resources.