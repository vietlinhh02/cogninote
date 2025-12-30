# ES Modules Migration Guide

## Overview

The CogniNote backend has been migrated from CommonJS to ES Modules (ESM) for better modern JavaScript support and improved tree-shaking capabilities.

## Changes Made

### 1. Package Configuration

**package.json**
```json
{
  "type": "module"  // Added to enable ESM
}
```

**Key changes:**
- Added `"type": "module"` to enable ES Modules
- Replaced `ts-node` with `tsx` for better ESM support
- Updated test scripts to use `NODE_OPTIONS='--experimental-vm-modules'`

### 2. TypeScript Configuration

**tsconfig.json**
```json
{
  "compilerOptions": {
    "module": "ESNext",  // Changed from "commonjs"
    // ... other options
  },
  "ts-node": {
    "esm": true,
    "experimentalSpecifierResolution": "node"
  }
}
```

**Key changes:**
- Changed `module` from `"commonjs"` to `"ESNext"`
- Added `ts-node` configuration for ESM support

### 3. Import Statements

All imports now use explicit `.js` file extensions (even for TypeScript files):

**Before (CommonJS):**
```typescript
import { config } from './config';
import { logger } from './utils/logger';
```

**After (ESM):**
```typescript
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
```

**Why `.js` extension?**
- TypeScript compiles `.ts` files to `.js`
- ESM requires explicit file extensions
- TypeScript is smart enough to find `.ts` source files even when you specify `.js`

### 4. Jest Configuration

**jest.config.js**
```javascript
export default {  // Changed from module.exports
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',  // Strip .js for Jest
    // ... path aliases
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true
    }]
  }
}
```

**Key changes:**
- Changed from `module.exports` to `export default`
- Used `ts-jest/presets/default-esm` preset
- Added `extensionsToTreatAsEsm` for TypeScript files
- Configured transform to use ESM mode
- Added module name mapper to handle `.js` extensions in tests

### 5. All Source Files Updated

**Files with import updates:**
- `src/app.ts` - All route and utility imports
- `src/index.ts` - App and config imports
- `src/config/database.ts` - Config and logger imports
- `src/config/redis.ts` - Config and logger imports
- `src/middlewares/error-handler.ts` - Logger import
- `src/middlewares/rate-limiter.ts` - Config import
- `src/utils/logger.ts` - Config import
- `src/routes/health.routes.ts` - Database and Redis imports
- All test files in `src/tests/`

## Running the Application

### Development
```bash
npm run dev
# Uses tsx for ESM TypeScript execution
```

### Production Build
```bash
npm run build
npm start
# Compiles to ESM JavaScript in dist/
```

### Testing
```bash
npm test
# Uses Jest with ESM support
```

## Benefits of ES Modules

1. **Modern Standard**: ESM is the official JavaScript module standard
2. **Better Tree Shaking**: Improved dead code elimination in bundlers
3. **Static Analysis**: Tools can better analyze import/export relationships
4. **Browser Compatibility**: Same module system for Node.js and browsers
5. **Top-level Await**: Can use `await` at module top level (Node.js 14.8+)
6. **Strict Mode**: ESM modules are always in strict mode by default

## Troubleshooting

### Common Issues

**1. "Cannot find module" errors**
- Make sure all imports use `.js` extension
- Check that path aliases are correctly mapped in `tsconfig.json`

**2. "require is not defined"**
- Check for any remaining CommonJS syntax
- Use `import` instead of `require`
- Use `export` instead of `module.exports`

**3. Jest test failures**
- Ensure `NODE_OPTIONS` is set in test scripts
- Check that `jest.config.js` uses `export default`
- Verify module name mappers are correct

**4. TypeScript compilation errors**
- Ensure `module` is set to `"ESNext"` in `tsconfig.json`
- Check that `esModuleInterop` is enabled

### Importing JSON Files

**Before:**
```typescript
const data = require('./data.json');
```

**After:**
```typescript
import data from './data.json' assert { type: 'json' };
```

### Dynamic Imports

```typescript
// Still works the same way
const module = await import('./module.js');
```

### __dirname and __filename

In ESM, `__dirname` and `__filename` are not available. Use this instead:

```typescript
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
```

## Migration Checklist

- [x] Add `"type": "module"` to package.json
- [x] Update TypeScript config to use ESNext modules
- [x] Replace ts-node with tsx
- [x] Add `.js` extensions to all imports
- [x] Convert all `require()` to `import`
- [x] Convert all `module.exports` to `export`
- [x] Update Jest configuration for ESM
- [x] Update test files to use ESM imports
- [x] Test all functionality

## References

- [Node.js ES Modules Documentation](https://nodejs.org/api/esm.html)
- [TypeScript ESM Support](https://www.typescriptlang.org/docs/handbook/esm-node.html)
- [Jest ESM Support](https://jestjs.io/docs/ecmascript-modules)
- [tsx - TypeScript Execute](https://github.com/esbuild-kit/tsx)
