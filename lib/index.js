/**
 * Core dependencies.
 */
import crypto from 'crypto';
import {
	existsSync,
	readFileSync,
	statSync,
	writeFileSync,
} from 'node:fs';
import {
	dirname,
	resolve,
} from 'path';

/**
 * Third-party dependencies.
 */
//import { parse as parseModule } from 'es-module-lexer/minimal';
import glob from 'fast-glob';

/**
 * Constants
 */
const PLUGIN_NAME = 'AustereBuildRspack';

export default class AustereBuild {

	constructor( options = {} ) {
		const defaultOptions = {
			entries: [],
			hash: false,
			outputDir: resolve( process.cwd(), 'dist' ),
			type: 'non-specific',
		};

		this.options = Object.assign( defaultOptions, options );
	}

	/**
	 * Apply the hooks for the plugin for Rspack.
	 *
	 * @param {Compiler} compiler
	 */
	apply( compiler ) {
		compiler.hooks.entryOption.tap( PLUGIN_NAME, ( context, entries ) => {
			const pluginEntries = {
				...this.entryPointsRegular(),
				...this.entryPointsWordPress(),
			};

			for ( const name of Object.keys( pluginEntries ) ) {
				compiler.options.entry[ name ] = {
					import: [ pluginEntries[ name ] ],
				};
			}
		} );

		compiler.hooks.afterCompile.tap( PLUGIN_NAME, ( compilation ) => {

		} );
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
		if ( 'wordpress' === this.options.type && !! this.options.blocks ) {
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
			//config.assetIgnore = [ ...config.assetIgnore ?? [], ...Object.keys( additionalEntries ) ];

			/**
			 * Add to the list of entries for the CSS and JS built process.
			 */
			Object.assign( entries, additionalEntries );
		}

		return entries;
	}
}
