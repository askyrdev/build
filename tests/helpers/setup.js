/**
 * Core dependencies.
 */
import { mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const rootDir = resolve( import.meta.dirname, '../../testResults' );

/**
 * Clean up the test results area for the new tests.
 */
await rm( rootDir, { recursive: true, force: true } );
await mkdir( rootDir, { recursive: true } );
