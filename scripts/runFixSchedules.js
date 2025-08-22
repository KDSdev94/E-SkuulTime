#!/usr/bin/env node

/**
 * Simple runner for the schedule fix script
 * 
 * Usage:
 * node scripts/runFixSchedules.js
 * 
 * OR
 * 
 * npm run fix-schedules (if you add it to package.json scripts)
 */

import { runScript } from './fixSchedules.js';

console.log('🔧 SCHEDULE FIX UTILITY');
console.log('=======================');
console.log('');
console.log('This script will:');
console.log('✓ Find all schedules with missing teacher information');
console.log('✓ Automatically assign appropriate teachers to them');
console.log('✓ Send notifications to affected teachers from Admin (ID: 001)');
console.log('✓ Ensure all teachers can see their schedules in the app');
console.log('');

// Ask for confirmation
import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Do you want to proceed with fixing the schedules? (y/N): ', async (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        console.log('');
        console.log('🚀 Starting schedule fix process...');
        console.log('');
        
        try {
            await runScript();
            console.log('');
            console.log('✅ Schedule fix completed successfully!');
            console.log('📱 Teachers should now be able to see their schedules in the app.');
            console.log('📧 All affected teachers have been notified.');
        } catch (error) {
            console.error('');
            console.error('❌ Error during schedule fix:', error.message);
            console.error('Please check the logs and try again.');
        }
    } else {
        console.log('');
        console.log('❌ Schedule fix cancelled.');
    }
    
    rl.close();
    process.exit(0);
});
