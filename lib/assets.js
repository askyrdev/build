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

/**
 * Internal dependencies.
 */
import dependencies from './dependencies.js';

/**
 * Constants
 */
const EXCLUDE = [ 'asset', 'unknown' ];
const HASHES = [ 'sha-256', 'sha-384', 'sha-512' ];

export default function ( { ignore, outputDir }, compilation ) {
	const enqueuing = [];

	const dependencyMap = dependencies( compilation );

	const assets = compilation.getAssets();
	for ( const { name, info: { assetType } } of assets ) {
		/**
		 * Exclude assets.
		 */
		if ( EXCLUDE.includes( assetType ) ) {
			continue;
		}

		/**
		 * Exclude any entries which have been added to the ignore list, for example, WordPress blocks.
		 */
		const basename = name.substring( 0, name.lastIndexOf( '.' ) );
		if ( ignore && ignore.includes( basename ) ) {
			continue;
		}

		const filePath = `${outputDir}/${name}`;

		if ( ! existsSync( filePath ) ) {
			continue;
		}

		const fileStats = statSync( filePath );

		const fileData = readFileSync( filePath );
		const fileHashes = [];
		for ( const hash of HASHES ) {
			const fileHash = crypto
				.createHash( hash )
				.update( fileData.toString(), 'utf8' )
				.digest( 'base64' );

			fileHashes.push( `${hash.replace('-', '')}-${fileHash}` );
		}

		enqueuing.push( {
			id: basename,
			filename: name,
			size: fileStats.size / 1024, // Convert to KBs.
			hashes: fileHashes,
			type: assetType,
			version: crypto
				.createHash( 'md5' )
				.update( fileData.toString(), 'utf8' )
				.digest( 'hex' ),
			dependencies: 'javascript' === assetType ? ( dependencyMap[ basename ] ?? [] ) : [],
		} );
	}

	writeFileSync( `${outputDir}/assets.json`, JSON.stringify( enqueuing, null, 4 ) );
};
