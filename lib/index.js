/**
 * Core dependencies.
 */
import { readFileSync } from 'node:fs';
import {
	dirname,
	extname,
	join,
	resolve,
} from 'node:path';

/**
 * Third-party dependencies.
 */
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
import emptyScripts from './emptyScripts.js';
import { WPEXTERNALS } from './externals.js';
import patterns from './patterns.js';
import pluginRules from './rules.js';

/**
 * Constants
 */
const PLUGIN_NAME = 'AskyrBuildPlugin';

export default class AskyrBuild {

	constructor( options = {} ) {
		const defaultOptions = {
			assetMeta: {},
			copyExtensions: [
				'avif',
				'flac',
				'gif',
				'jpg',
				'jpeg',
				'ico',
				'mp3',
				'mp4',
				'ogg',
				'otf',
				'pdf',
				'png',
				'svg',
				'ttf',
				'webm',
				'webp',
				'woff',
				'woff2',
			],
			copyPatterns: [],
			globalFiles: [],
			hash: false,
			ignore: [],
			outputDir: 'dist',
			rules: {
				asset: true,
				css: true,
				javascript: true,
				json: true,
			},
			type: 'non-specific',
		};

		this.options = Object.assign( defaultOptions, options );

		this.dependencies = {};
	}

	/**
	 * Apply the hooks for the plugin for Rspack.
	 *
	 * @param {Compiler} compiler
	 */
	apply( compiler ) {
		const context = compiler.options.context;
		const type = this.options.type;

		let pluginEntries = {};
		if ( 'wordpress' === type ) {
			pluginEntries = {
				...this.entryPointsWordPress( context ),
			};
		}

		/**
		 * Convert the outputDir from relative to absolute path.
		 */
		this.options.outputDir = resolve( context, this.options.outputDir );

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

		const rules = pluginRules( this.options );
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
				...patterns( this.options, context ),
			],
		} ).apply( compiler );

		for ( const name of Object.keys( pluginEntries ) ) {
			new EntryPlugin( compiler.context, pluginEntries[ name ], { name } ).apply( compiler );
		}

		new ExternalsPlugin( 'window', [
			( { request }, callback ) => {
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
							/**
							 * Remove the namespace and then camelCase the library. WordPress dependency extraction/core
							 * uses its own logic for this, which is replicated here for compatibility.
							 *
							 * @link {https://github.com/WordPress/gutenberg/blob/d3c65d3a7edc5728d173309e3ca093c84d301438/packages/dependency-extraction-webpack-plugin/lib/util.js#L146-L157}
							 */
							return callback( null, [ 'wp', `${request.substring( WPEXTERNALS.namespace.length ).replace( /-([a-z])/g, ( _, letter ) => letter.toUpperCase() )}` ] );
						} else if ( WPEXTERNALS.other[ request ] ) {
							return callback( null, `${WPEXTERNALS.other[ request ]}` );
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
		compiler.hooks.compilation.tap( PLUGIN_NAME, ( compilation ) => {
			compilation.hooks.processAssets.tap(
				{
					name: 'AskyrRemoveEmptyScripts',
					stage: compiler.rspack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
				},
				() => emptyScripts( compilation ),
			)
		} );
		compiler.hooks.afterEmit.tap( PLUGIN_NAME, ( compilation ) => assets( this.options, compilation ) );

		// if ( 'drupal' === this.options.type && this.options.drupal.cacheRebuild ) {
		// 	compiler.hooks.afterDone.tap( PLUGIN_NAME, ( { hasErrors } ) => {
		// 		if ( hasErrors ) {
		// 			return;
		// 		}
		//
		// 		/**
		// 		 * Check to see if the build should use Lando rather than Drush raw.
		// 		 */
		// 		const drushCommand = !! this.options.drupal.lando ? 'lando drush' : 'drush';
		//
		// 		if ( Array.isArray( this.options.drupal.cacheRebuild ) ) {
		// 			this.options.drupal.cacheRebuild.forEach( ( site ) => {
		// 				childProcess.exec( `${ drushCommand } ${ site } cache:rebuild` );
		// 			} );
		// 		} else {
		// 			/**
		// 			 * Default Drush call.
		// 			 */
		// 			childProcess.exec( `${ drushCommand } cache:rebuild` );
		// 		}
		// 	} );
		// }
	}

	entryPointsWordPress( context ) {
		if ( 'wordpress' === this.options.type && ! this.options?.blocks ) {
			return {};
		}

		const entries = {};
		for ( const name of Object.keys( this.options.blocks ) ) {
			const blockDirectory = resolve( context, this.options.blocks[ name ] );
			const blockMetaFiles = glob.sync( `${ blockDirectory }/**/block.json`, { absolute: true } );

			const additionalEntries = blockMetaFiles.reduce( ( acc, blockMetaFile ) => {
				const {
					editorScript,
					editorStyle,
					name,
					script,
					style,
					viewScript,
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

				this.dependencies[ name ] = [];

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

							const entryName = `blocks${entryFilePath}`
								.replace( extname( filePath ), '' )
								.replace( blockDirectory, '' );

							this.dependencies[ name ].push( entryFilePath );
							acc[ entryName ] = entryFilePath;
						}
					);

				return acc;
			}, {} );

			/**
			 * Add to the list of entries for the CSS and JS built process.
			 */
			Object.assign( entries, additionalEntries );
		}

		return entries;
	}
}
