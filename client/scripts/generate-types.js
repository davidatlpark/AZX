import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Default to development URL if not specified
const API_URL = process.env.API_URL || 'http://localhost:8000';
const OUTPUT_PATH = resolve(__dirname, '../src/generated/schema.d.ts');

console.log(`Generating types from OpenAPI schema at ${API_URL}/openapi.json`);

try {
  execSync(
    `pnpm exec openapi-typescript ${API_URL}/openapi.json --output ${OUTPUT_PATH}`,
    { stdio: 'inherit' }
  );
  console.log('Types generated successfully!');
} catch (error) {
  console.error('Error generating types:', error.message);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1); // Fail the build in production
  } else {
    console.warn('Warning: Using existing schema.d.ts file');
  }
}
