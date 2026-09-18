import { defineConfig } from '@railway/cli';

export default defineConfig({
  services: {
    backend: {
      builder: 'nixpacks',
      serviceName: 'backend',
      source: 'packages/backend',
      startCommand: 'node dist/index.js',
      buildCommand: 'pnpm build --filter @trading-os/backend',
      environments: {
        production: {
          port: 3001
        }
      }
    },
    frontend: {
      builder: 'nixpacks',
      serviceName: 'frontend',
      source: 'packages/frontend',
      buildCommand: 'pnpm build --filter @trading-os/frontend',
      startCommand: 'npm run start',
      environments: {
        production: {
          port: 3000
        }
      }
    }
  }
});
