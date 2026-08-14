/**
 * Constants
 */
/**
 * @link {https://github.com/WordPress/gutenberg/blob/9602efe83831df5d38d8320a6cc9f7a3f0342826/packages/dependency-extraction-webpack-plugin/lib/util.js#L16-L68}
 */
export const WPEXTERNALS = {
	namespace: '@wordpress/',
	other: {
		'moment': 'moment',
		'@babel/runtime/regenerator': 'regeneratorRuntime',
		'lodash': 'lodash',
		'lodash-es': 'lodash',
		'jquery': 'jquery',
		'react': 'React',
		'react-dom': 'ReactDOM',
		'react-dom/client': 'ReactDOM',
		'react/jsx-runtime': 'ReactJSXRuntime',
		'react/jsx-dev-runtime': 'ReactJSXRuntime',
		'react-refresh/runtime': 'ReactRefreshRuntime',
	},
	ignore: [
		'@wordpress/admin-ui',
		'@wordpress/dataviews',
		'@wordpress/dataviews/wp',
		'@wordpress/fields',
		'@wordpress/grid',
		'@wordpress/icons',
		'@wordpress/interface',
		'@wordpress/style-runtime',
		'@wordpress/ui',
		'@wordpress/undo-manager',
		'@wordpress/views',
	],
};

/**
 * Maps externalized requests to their WordPress enqueue handles.
 *
 * @link {https://github.com/WordPress/gutenberg/blob/9602efe83831df5d38d8320a6cc9f7a3f0342826/packages/dependency-extraction-webpack-plugin/lib/util.js#L70-L108}
 */
const HANDLES = {
	'moment': 'moment',
	'@babel/runtime/regenerator': 'wp-polyfill',
	'lodash': 'lodash',
	'lodash-es': 'lodash',
	'jquery': 'jquery',
	'react': 'react',
	'react-dom': 'react-dom',
	'react-dom/client': 'react-dom',
	'react/jsx-runtime': 'react-jsx-runtime',
	'react/jsx-dev-runtime': 'react-jsx-runtime',
	'react-refresh/runtime': 'wp-react-refresh-runtime',
};

/**
 * Convert an externalized module request to the corresponding WordPress script handle
 * for use with `wp_enqueue_script()`.
 *
 * @param {string} request Module request, e.g. `@wordpress/i18n` or `lodash-es`.
 * @returns {string|null} The script handle, or `null` if the request is not externalized.
 */
export function requestToHandle( request ) {
	if ( request.startsWith( WPEXTERNALS.namespace ) ) {
		return `wp-${request.substring( WPEXTERNALS.namespace.length )}`;
	}

	return HANDLES[ request ] ?? null;
}
