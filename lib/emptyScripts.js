/**
 * Build a map of entry name to the sorted, de-duplicated list of WordPress script handles
 * for the externalized modules used by that entry.
 *
 * @ai-assist {Claude|Sonnet 5} General approach and rubber-ducking.
 *
 * @param {import('@rspack/core').Compilation} compilation
 */
export default function emptyScripts( compilation ) {
	const { chunkGraph } = compilation;

	for ( const chunk of compilation.chunks ) {
		const modules = chunkGraph.getChunkModules( chunk );
		if ( 0 === modules.length || ! chunk?.files ) {
			continue;
		}

		const isCssOnly = modules.every( ( item ) =>
			[ 'css', 'css/auto', 'css/mini-extract' ].includes( item.type )
		);
		if ( ! isCssOnly ) {
			continue;
		}

		for ( const file of chunk.files ) {
			if ( file.endsWith( '.js' ) ) {
				compilation.deleteAsset( file );
				chunk.files.delete( file );
			}
		}
	}
}
