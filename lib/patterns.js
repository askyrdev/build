/**
 * Core dependencies.
 */
import { join, resolve } from 'path';

export default function( { copyExtensions, blocks, type } ) {
	const blockPatterns = [];
	const supportedExtensions = copyExtensions.join( ',' );

	if ( 'wordpress' === type && !! blocks ) {
		for ( const name of Object.keys( blocks ) ) {
			const blockDirectory = resolve( process.cwd(), blocks[ name ] );

			/**
			 * Add the pattern for copying the `block.json` definition files.
			 */
			blockPatterns.push( {
				from: join( blockDirectory, '**/block.json' ),
				context: blockDirectory,
				noErrorOnMissing: true,
				to: 'blocks/[path][name][ext]',
			} );

			/**
			 * Add the pattern for copying any static assets for the individual blocks.
			 */
			blockPatterns.push( {
				from: join( blockDirectory, `**/*.{${supportedExtensions}}` ),
				context: blockDirectory,
				noErrorOnMissing: true,
				to: 'blocks/[path][name][ext]',
			} );
		}
	}

	return [
		...blockPatterns,
		/**
		 * Move other static assets, such as images and fonts.
		 */
		{
			from: `**/*.{${supportedExtensions}}`,
			context: 'assets/',
			noErrorOnMissing: true,
			to: '[path][name][ext]',
		},
	]
};
