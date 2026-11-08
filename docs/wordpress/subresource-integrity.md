# Subresource Integrity

Askyr Build when generating the `assets.json` file will also calculate the hashes that can be used for Subresource
Integrity. This adds an extra layer of security for visitors of your WordPress site by ensuring the generate code hasn't
been modified since it was built.

This can be integrated into WordPress using `wp_script_attributes` filter hook. Using the example of enqueuing the
scripts from Enqueuing.


```php title="functions.php"
/**
 * Load the assets.
 *
 * NOTE: This is done for brevity and isn't recommended. You are best using a class in an object-oriented approach.
 */
$asset_hashes = [];

function enqueue_assets() {
    $assets = wp_json_file_decode( MY_THEME_PATH, [ 'associative' => true ] );
    if ( empty( $assets ) ) {
        return;
    }

    foreach ( $assets as $asset ) {
        $asset_id  = sanitize_title( $asset['id'] );
        $asset_url = sprintf( '%sdist/%s', get_template_directory_uri(), $asset['filename'] );
    
        if ( 'javascript' === $asset['type'] ) {
            /**
             * Store the hashes using the ID for the enqueue key. This is to make sure it matches the later when adding
             * the subresource integrity attribute.
             */
            $asset_hashes[ $asset_id ] = $asset['hashes'];
            
            wp_enqueue_script(
                $asset_id,
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

You can then add the following;

```php title="functions.php"
/**
 * Add subresource integrity attributes for enqueued scripts.
 * 
 * @param array $attributes Attributes for a specific script.
 * @param array
 */
function enqueue_script_hashes( $attributes ) {
    if ( empty( $assets ) || empty( $attributes['id'] ) ) {
        return $attributes;
    }

    $hashes = $asset_hashes[ $attributes['id'] ] ?? [];
    if ( empty( $hashes ) ) {
        return $attributes;
    }
    
    $attributes['integrity'] = implode( ' ', $hashes );
    return $attributes;
}
add_filter( 'wp_script_attributes', 'enqueue_script_hashes' );
```

## Additional resources

* https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Subresource_Integrity
* https://developer.wordpress.org/reference/hooks/wp_script_attributes/