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

	it( 'Contains expected WordPress dependencies in assets.json', () => {
		const assetsJson = JSON.parse( readFileSync( `${ result.outputDir }/assets.json`, 'utf8' ) );

		const indexEntry = assetsJson.find( ( entry ) => entry.filename === 'blocks/example/index.js' );
		assert.ok( indexEntry, 'blocks/example/index.js entry exists in assets.json' );
		assert.deepStrictEqual(
			indexEntry.dependencies,
			[ 'wp-block-editor', 'wp-blocks', 'wp-i18n' ],
			'index.js extracts correct sorted script dependencies'
		);

		const viewScriptEntry = assetsJson.find( ( entry ) => entry.filename === 'blocks/example/viewScript.js' );
		assert.ok( viewScriptEntry, 'blocks/example/viewScript.js entry exists in assets.json' );
		assert.deepStrictEqual(
			viewScriptEntry.dependencies,
			[ 'wp-i18n' ],
			'viewScript.js extracts correct dependencies'
		);

		const viewCssEntry = assetsJson.find( ( entry ) => entry.filename === 'blocks/example/view.css' );
		assert.ok( viewCssEntry, 'blocks/example/view.css entry exists in assets.json' );
		assert.deepStrictEqual(
			viewCssEntry.dependencies,
			[],
			'CSS entries have an empty dependencies array'
		);
	} );

	it( 'Transpiles JSX in block editor scripts', () => {
		const compiledIndexJs = readFileSync( `${ result.outputDir }/blocks/example/index.js`, 'utf8' );

		assert.strictEqual( /<RichText\b/.test( compiledIndexJs ), false, 'No raw JSX RichText tags in output' );
		assert.strictEqual( /<div\b/.test( compiledIndexJs ), false, 'No raw JSX div tags in output' );
	} );

	it( 'Externalizes WordPress modules in output bundles', () => {
		const compiledIndexJs = readFileSync( `${ result.outputDir }/blocks/example/index.js`, 'utf8' );

		assert.ok(
			compiledIndexJs.includes( 'wp.blocks' ) || compiledIndexJs.includes( 'window.wp' ),
			'Compiled index.js references external wp globals'
		);
	} );

	it( 'Emits valid compiled CSS', () => {
		const compiledCss = readFileSync( `${ result.outputDir }/blocks/example/view.css`, 'utf8' );

		assert.ok(
			compiledCss.includes( '.wp-block-example-block__title' ),
			'view.css contains the block class selector'
		);
		assert.ok(
			compiledCss.includes( '#FF0000' ) || compiledCss.includes( '#f00' ) || compiledCss.includes( 'red' ),
			'view.css contains the specified color rule'
		);
	} );

	it( 'Copies valid block.json to dist', () => {
		const blockJsonRaw = readFileSync( `${ result.outputDir }/blocks/example/block.json`, 'utf8' );
		const blockJson = JSON.parse( blockJsonRaw );

		assert.strictEqual( blockJson.name, 'askyrbuild/example' );
		assert.strictEqual( blockJson.editorScript, 'file:./index.js' );
		assert.strictEqual( blockJson.viewScript, 'file:./viewScript.js' );
		assert.strictEqual( blockJson.viewStyle, 'file:./view.css' );
	} );
} );
