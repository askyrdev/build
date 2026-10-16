/**
 * WordPress dependencies
 */
import { registerBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies.
 */
import edit from './edit.js';
import save from './save.js';
import block from './block.json';

registerBlockType(
	block,
	{
		edit,
		save,
	}
);
