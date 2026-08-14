/**
 * Third-party dependencies.
 */
import { ExternalModule } from '@rspack/core';

/**
 * Internal dependencies.
 */
import { requestToHandle } from './externals.js';

/**
 * Determine whether a module is an externalized module.
 *
 * @param {object} module Module from the compilation chunk graph.
 * @returns {boolean} True if the module is an external module.
 */
function isExternalModule( module ) {
	return module instanceof ExternalModule || module.identifier().startsWith( 'external ' );
}

/**
 * Build a map of entry name to the sorted, de-duplicated list of WordPress script handles
 * for the externalized modules used by that entry.
 *
 * @param {import('@rspack/core').Compilation} compilation
 * @returns {Object.<string, string[]>} Map of entry name to script handles.
 */
export default function dependencies( compilation ) {
	const map = {};

	for ( const [ name, entrypoint ] of compilation.entrypoints ) {
		const handles = new Set();

		for ( const chunk of entrypoint.chunks ) {
			for ( const chunkModule of compilation.chunkGraph.getChunkModulesIterable( chunk ) ) {
				/**
				 * Production builds concatenate modules together, which hides the external modules
				 * within, so make sure to check the inner modules as well.
				 */
				for ( const module of [ chunkModule, ...( chunkModule.modules ?? [] ) ] ) {
					if ( ! isExternalModule( module ) ) {
						continue;
					}

					const handle = requestToHandle( module.userRequest );
					if ( handle ) {
						handles.add( handle );
					}
				}
			}
		}

		map[ name ] = [ ...handles ].sort();
	}

	return map;
}
