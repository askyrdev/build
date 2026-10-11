/**
 * Core dependencies.
 */
import assert from 'node:assert';
import { existsSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

/**
 * Internal dependencies.
 */
import { compileFixture } from './helpers/compile.js';

const result = await compileFixture(
	'wordpress-blocks',
	{
		type: 'wordpress',
		blocks: {
			'main': 'includes/blocks'
		},
	}
);

describe( 'Compile WordPress Blocks', () => {
	it( 'Compile without error.', () => {
		assert.equal( result.stats.hasErrors(), false, 'No errors' );
	} );

	it( 'Created assets.json', () => {
		assert.equal( existsSync( result.outputDir + '/assets.json' ), true, 'assets.json exists' );
	} );

    const assetsJsonFileData = readFileSync( result.outputDir + '/assets.json' );
	const assetsJson = JSON.parse( assetsJsonFileData );

	it( 'assets.json is valid JSON', () => {
		assert.equal( Array.isArray(assetsJson), true, 'assets.json is valid JSON' );
	} );

	it( 'Output assets exist in dist/', () => {
		const validFilenames = [
			'blocks/block.json',
			'blocks/index.js',
			'blocks/view.css',
			'blocks/viewScript.js',
		];

		validFilenames.forEach( ( filename ) => {
			assert.equal( existsSync( result.outputDir + '/' + filename ), true, filename + ' exists' );
		} );
	} );
} );
