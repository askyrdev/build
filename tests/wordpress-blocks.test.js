/**
 * Core dependencies.
 */
import assert from 'node:assert';
import { existsSync } from 'node:fs';
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
} );
