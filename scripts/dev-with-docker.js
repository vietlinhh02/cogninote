#!/usr/bin/env node

import { spawn, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function checkDockerRunning() {
  try {
    await execAsync('docker info');
    return true;
  } catch (error) {
    return false;
  }
}

async function startContainers() {
  console.log('🐳 Starting Docker containers (database and Redis only)...');
  return new Promise((resolve, reject) => {
    const dockerProcess = spawn('docker-compose', ['-f', 'docker-compose.dev.yml', 'up', '-d'], {
      stdio: 'inherit',
      shell: true
    });

    dockerProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Docker containers started successfully');
        resolve();
      } else {
        reject(new Error(`Docker failed with code ${code}`));
      }
    });
  });
}

async function waitForServices() {
  console.log('⏳ Waiting for services to be ready...');
  
  // Simple wait - let containers start up
  await new Promise(resolve => setTimeout(resolve, 10000));
  console.log('✅ Services should be ready!');
}

async function startDevelopment() {
  console.log('🚀 Starting development server...');
  const devProcess = spawn('nodemon', ['--exec', 'tsx', 'src/index.ts'], {
    stdio: 'inherit',
    shell: true
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    devProcess.kill('SIGINT');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down...');
    devProcess.kill('SIGTERM');
    process.exit(0);
  });
}

async function main() {
  try {
    console.log('🔍 Checking Docker status...');
    
    if (!await checkDockerRunning()) {
      console.error('❌ Docker is not running. Please start Docker Desktop first.');
      process.exit(1);
    }

    await startContainers();
    await waitForServices();
    await startDevelopment();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();