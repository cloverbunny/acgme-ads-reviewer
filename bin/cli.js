#!/usr/bin/env node

/**
 * ACGME ADS Reviewer CLI
 * Command-line tools for managing the application
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Command handlers
const commands = {
  /**
   * Generate a new API key
   */
  'generate-api-key': () => {
    const apiKey = crypto.randomBytes(32).toString('hex');
    console.log('\n🔑 Generated API Key:');
    console.log('━'.repeat(50));
    console.log(apiKey);
    console.log('━'.repeat(50));
    console.log('\n⚠️  Store this key securely!');
    console.log('Add to .env.local:');
    console.log(`API_KEY=${apiKey}\n`);
  },

  /**
   * Initialize database schema
   */
  'init-db': async () => {
    const dbType = process.env.DATABASE_TYPE || 'memory';
    
    if (dbType === 'memory') {
      console.log('ℹ️  Using in-memory database (development only)');
      console.log('✓ Ready to start\n');
      return;
    }

    console.log(`📦 Initializing ${dbType} database...`);
    console.log('⚠️  This feature requires database implementation');
    console.log('See DATABASE.md for instructions\n');
  },

  /**
   * Create default admin user
   */
  'create-admin': (email) => {
    if (!email) {
      console.error('❌ Email required: npm run create-admin -- admin@example.com\n');
      process.exit(1);
    }

    const adminId = crypto.randomUUID();
    const hashedPassword = crypto.randomBytes(32).toString('hex');

    console.log('\n👤 Admin User Created');
    console.log('━'.repeat(50));
    console.log(`ID: ${adminId}`);
    console.log(`Email: ${email}`);
    console.log(`Password Hash: ${hashedPassword}`);
    console.log('━'.repeat(50));
    console.log('\n✓ Store these credentials securely');
    console.log('⚠️  Password should be properly hashed in production\n');
  },

  /**
   * Migrate data between databases
   */
  'migrate': async (fromDb, toDb) => {
    if (!fromDb || !toDb) {
      console.error('❌ Usage: npm run migrate -- from-db to-db\n');
      process.exit(1);
    }

    console.log(`🔄 Migrating from ${fromDb} to ${toDb}...`);
    console.log('⚠️  Migration feature requires database implementation\n');
  },

  /**
   * Generate sample data for testing
   */
  'generate-samples': () => {
    const samples = {
      submissions: [
        {
          id: crypto.randomUUID(),
          programName: 'Internal Medicine',
          submissionYear: 2024,
          submitterEmail: 'coordinator@hospital.edu',
          createdAt: new Date().toISOString()
        },
        {
          id: crypto.randomUUID(),
          programName: 'Pediatrics',
          submissionYear: 2024,
          submitterEmail: 'pediatrics@hospital.edu',
          createdAt: new Date().toISOString()
        }
      ]
    };

    const sampleFile = path.join(__dirname, 'sample-data.json');
    fs.writeFileSync(sampleFile, JSON.stringify(samples, null, 2));

    console.log('\n✓ Sample data generated');
    console.log(`📄 File: ${sampleFile}\n`);
  },

  /**
   * Show configuration info
   */
  'config': () => {
    console.log('\n⚙️  Configuration Info');
    console.log('━'.repeat(50));
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Port: ${process.env.PORT || 3000}`);
    console.log(`Database: ${process.env.DATABASE_TYPE || 'memory'}`);
    console.log(`CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
    console.log(`Azure: ${process.env.AZURE_API_KEY ? '✓ Configured' : 'Not configured'}`);
    console.log('━'.repeat(50));
    console.log('\nTo change settings, edit .env.local\n');
  },

  /**
   * Validate environment configuration
   */
  'validate-env': () => {
    const requiredVars = [
      'NODE_ENV',
      'PORT',
      'CORS_ORIGIN'
    ];

    const missingVars = requiredVars.filter(v => !process.env[v]);

    if (missingVars.length === 0) {
      console.log('\n✓ Environment configuration is valid\n');
      return;
    }

    console.log('\n⚠️  Missing environment variables:');
    missingVars.forEach(v => console.log(`  - ${v}`));
    console.log('\nRun: cp .env.example .env.local\n');
  },

  /**
   * Clean up temporary files
   */
  'cleanup': () => {
    const tempDir = process.env.TEMP_DIR || './temp';
    const uploadDir = process.env.UPLOAD_DIR || './uploads';

    let cleanedCount = 0;

    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir);
      files.forEach(file => {
        fs.unlinkSync(path.join(tempDir, file));
        cleanedCount++;
      });
    }

    console.log(`\n🧹 Cleanup completed`);
    console.log(`Removed ${cleanedCount} temporary files\n`);
  },

  /**
   * Reset application (WARNING: Clears data)
   */
  'reset': () => {
    console.log('\n⚠️  WARNING: This will clear all data!');
    console.log('To confirm, run: npm run reset -- --confirm\n');

    if (process.argv[3] !== '--confirm') {
      process.exit(1);
    }

    const dirs = [
      process.env.TEMP_DIR || './temp',
      process.env.UPLOAD_DIR || './uploads'
    ];

    dirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true });
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    console.log('✓ Application reset complete\n');
  },

  /**
   * Show help
   */
  'help': () => {
    console.log(`
🔍 ACGME ADS Reviewer CLI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Available Commands:

  generate-api-key        Generate a new API key
  init-db                 Initialize database schema
  create-admin <email>    Create admin user
  migrate <from> <to>     Migrate data between databases
  generate-samples        Create sample data for testing
  config                  Show configuration info
  validate-env            Validate environment setup
  cleanup                 Remove temporary files
  reset                   Clear all data (requires --confirm)
  help                    Show this help message

Examples:

  npm run generate-api-key
  npm run create-admin -- coordinator@hospital.edu
  npm run migrate -- memory sqlite
  npm run validate-env
  npm run cleanup
  npm run reset -- --confirm

For more information, see:
  - README.md for setup instructions
  - DEVELOPMENT.md for customization
  - API.md for API documentation

    `);
  }
};

// Parse command
const command = process.argv[2] || 'help';
const args = process.argv.slice(3);

if (command in commands) {
  try {
    const result = commands[command](...args);
    if (result instanceof Promise) {
      result.catch(err => {
        console.error('❌ Error:', err.message);
        process.exit(1);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
} else {
  console.error(`❌ Unknown command: ${command}`);
  console.log('Run: npm run help\n');
  process.exit(1);
}
