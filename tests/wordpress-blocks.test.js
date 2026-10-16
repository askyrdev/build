/**
 * Core dependencies.
 */
import assert from 'node:assert';
import {
	existsSync,
	readFileSync,
} from 'node:fs';
import { before, describe, it } from 'node:test';

/**
 * Internal dependencies.
 */
import { compileFixture } from './helpers/compile.js';

describe( 'Compile WordPress Blocks', () => {
	let result;

	before( async () => {
		result = await compileFixture(
			'wordpress-blocks',
			{
				type: 'wordpress',
				blocks: {
					'main': 'includes/blocks'
				},
			}
		);
	} );

	it( 'Compile without error.', () => {
		assert.equal( result.stats.hasErrors(), false, 'No errors' );
	} );

	it( 'Created assets.json', () => {
		assert.equal( existsSync( result.outputDir + '/assets.json' ), true, 'assets.json exists' );
	} );

    it( 'assets.json is valid JSON', () => {
		const assetsJsonFileData = readFileSync( result.outputDir + '/assets.json' );
		const assetsJson = JSON.parse( assetsJsonFileData );

		assert.equal( Array.isArray(assetsJson), true, 'assets.json is valid JSON' );
	} );

	it( 'Output assets exist in dist/', () => {
		const validFilenames = [
			'blocks/example/block.json',
			'blocks/example/index.js',
			'blocks/example/view.css',
			'blocks/example/viewScript.js',
		];

		validFilenames.forEach( ( filename ) => {
			assert.equal( existsSync( result.outputDir + '/' + filename ), true, filename + ' exists' );
		} );
	} );

	// TODO: check the dependencies for the JS files in asset.json
} );
