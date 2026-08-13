/**
 * Core dependencies.
 */
import { readFileSync } from 'node:fs';
import {
	dirname,
	extname,
	join,
	resolve,
} from 'path';

/**
 * Third-party dependencies.
 */
//import { parse as parseModule } from 'es-module-lexer/minimal';
import glob from 'fast-glob';
import {
	Compiler,
	CopyRspackPlugin,
	EntryPlugin,
	ExternalsPlugin,
} from '@rspack/core';

/**
 * Internal dependencies.
 */
import assets from './assets.js';
import patterns from './patterns.js';
import pluginRules from './rules.js';

/**
 * Constants
 */
const PLUGIN_NAME = 'AustereBuildRspack';
/**
 * @link {https://github.com/WordPress/gutenberg/blob/9602efe83831df5d38d8320a6cc9f7a3f0342826/packages/dependency-extraction-webpack-plugin/lib/util.js#L16-L68}
 */
const WPEXTERNALS = {
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

export default class AustereBuild {

	constructor( options = {} ) {
		const defaultOptions = {
			copyExtensions: [
				'jpg',
				'jpeg',
				'png',
				'gif',
				'svg',
				'ttf',
				'woff',
				'woff2',
				'otf',
			],
			copyPatterns: [],
			entries: [],
			globalFiles: [],
			hash: false,
			ignore: [],
			outputDir: 'dist',
			type: 'non-specific',
		};

		this.ignore  = [];
		this.options = Object.assign( defaultOptions, options );

		/**
		 * Convert the outputDir from relative to absolute path.
		 */
		this.options.outputDir = resolve( process.cwd(), this.options.outputDir );
	}

	/**
	 * Apply the hooks for the plugin for Rspack.
	 *
	 * @param {Compiler} compiler
	 */
	apply( compiler ) {
		const pluginEntries = {
			...this.entryPointsRegular(),
			...this.entryPointsWordPress(),
		};
		const type = this.options.type;

		/**
		 * This is needed to ensure that module.rules can be found properly without having to change the loader name
		 * each time. Also, it looks within both the dependencies included by the project using Austere Build and then
		 * checks the Austere Build package dependencies, provided a bit of flexibility for people using this library.
		 */
		compiler.options.resolveLoader = {
			modules: [
				'node_modules',
				resolve( import.meta.dirname, '../node_modules' ),
			],
		};

		const rules = pluginRules( this.options.globalFiles );
		if ( 0 === compiler.options.module?.rules?.length ) {
			compiler.options.module.rules = [
				...rules,
			];
		}

		/**
		 * Include the directives for copying static assets. Additionally, give the option for people to add their own
		 * patterns as well.
		 */
		new CopyRspackPlugin( {
			patterns: [
				...this.options.copyPatterns,
				...patterns( this.options ),
			],
		} ).apply( compiler );

		for ( const name of Object.keys( pluginEntries ) ) {
			new EntryPlugin( compiler.context, pluginEntries[ name ], { name } ).apply( compiler );
		}

		new ExternalsPlugin( 'global', [
			( { request }, callback ) => {
				// TODO: custom (this goes first, to give precedence.

				// TODO: Drupal

				/**
				 * As WooCommerce is a plugin for WordPress, this works on the assumption that WooCommerce JS and WordPress will be
				 * intertwined and the `@wordpress/` libraries as well.
				 */
				if ( [ 'woocommerce', 'wordpress' ].includes( type ) ) {
					if ( ! WPEXTERNALS.ignore.includes( request ) ) {
						/**
						 * This is the equivalent for WordPress core's dependency extraction package.
						 */
						if ( request.startsWith( WPEXTERNALS.namespace ) ) {
							callback( null, `wp.${request.substring( WPEXTERNALS.namespace.length )}` );
						} else if ( WPEXTERNALS.other[ request ] ) {
							callback( null, WPEXTERNALS.other[ request ] );
						}
					}
				}

				// TODO: WooCommerce

				callback();
			}
		] ).apply( compiler );

		/**
		 * Hooks
		 */
		compiler.hooks.afterCompile.tap( PLUGIN_NAME, ( compilation ) => assets( this.options, compilation ) );
	}

	entryPointsRegular() {
		const entries = {};

		for ( const name of Object.keys( this.options.entries ) ) {
			/**
			 * Convert the relative paths to full path paths for rspack.
			 */
			entries[ name ] = resolve( process.cwd(), this.options.entries[ name ] );
		}

		return entries;
	}

	entryPointsWordPress() {
		if ( 'wordpress' === this.options.type && ! this.options?.blocks ) {
			return {};
		}

		const entries = {};
		for ( const name of Object.keys( this.options.blocks ) ) {
			const blockDirectory = resolve( process.cwd(), this.options.blocks[ name ] );
			const blockMetaFiles = glob.sync( `${ blockDirectory }/**/block.json`, { absolute: true } );

			const additionalEntries = blockMetaFiles.reduce( ( acc, blockMetaFile ) => {
				const {
					editorScript,
					script,
					viewScript,
					style,
					editorStyle,
					viewStyle,
				} = JSON.parse( readFileSync( blockMetaFile ) );

				const blockMetaDir = dirname( blockMetaFile );
				const blockAssets = [];

				/**
				 * Retrieve the key/values which can reference the assets for the build.
				 */
				blockAssets.push(
					...[ editorScript, script, viewScript, style, editorStyle, viewStyle ].filter(
						Boolean,
					)
				);

				blockAssets
					.filter(
						/**
						 * Make sure to only grab properties with a `file:` value.
						 */
						( filePath ) => filePath && filePath.startsWith( 'file:' )
					)
					.forEach(
						( filePath ) => {
							/**
							 * Remove the
							 */
							const entryFilePath = join(
								blockMetaDir,
								filePath.replace( 'file:', '' )
							);

							const entryName = 'blocks' + entryFilePath
								.replace( extname( filePath ), '' )
								.replace( blockDirectory, '' );

							acc[ entryName ] = entryFilePath;
						}
					);

				return acc;
			}, {} );

			/**
			 * WordPress uses a custom enqueuing system straight from the `block.json` files. Therefore, we need to note
			 * which assets are blocks so that we can exclude it from the `assets.json` on output.
			 */
			this.options.ignore = [ ...this.options.ignore ?? [], ...Object.keys( additionalEntries ) ];

			/**
			 * Add to the list of entries for the CSS and JS built process.
			 */
			Object.assign( entries, additionalEntries );
		}

		return entries;
	}
}
