/**
 * Core dependencies.
 */
import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const rootDir = join( process.cwd(), 'testResults' );

/**
 * Clean up the test results area for the new tests.
 */
await rm( rootDir, { recursive: true, force: true } );
await mkdir( rootDir, { recursive: true } );
