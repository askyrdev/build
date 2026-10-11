/**
 * Core dependencies.
 */
import { mkdtempSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * Third party dependencies.
 */
import { rspack } from '@rspack/core';

/**
 * Internal dependencies.
 */
import AskyrBuild from '../../lib/index.js';

export async function compileFixture( fixtureName, pluginOptions = {} ) {
	const fixtureDir = resolve( import.meta.dirname, '../fixtures', fixtureName );
	const outputDir = mkdtempSync( join( process.cwd(), 'testResults', 'askyr-test-' ) );

	const compiler = rspack( {
		mode: 'production',
		context: fixtureDir,
		entry: {},
		output: {
			path: outputDir,
			clean: true,
		},
		plugins: [
			new AskyrBuild( {
				outputDir,
				...pluginOptions,
			} ),
		],
	} );

	return new Promise(( resolve, reject ) => {
		compiler.run( ( err, stats ) => {
			if ( err ) {
				return reject( err );
			}

			resolve( { stats, outputDir } );
		});
	});
}
