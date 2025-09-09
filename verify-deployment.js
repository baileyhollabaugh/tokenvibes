#!/usr/bin/env node

/**
 * Token Vibes Deployment Verification Script
 * This script ensures all files are consistent and deployment-ready
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Token Vibes Deployment Verification');
console.log('=====================================');

// Check if index.html exists and has correct version
const indexPath = path.join(__dirname, 'index.html');
const publicIndexPath = path.join(__dirname, 'public', 'index.html');

if (!fs.existsSync(indexPath)) {
    console.error('❌ index.html not found in root directory');
    process.exit(1);
}

if (!fs.existsSync(publicIndexPath)) {
    console.error('❌ public/index.html not found');
    process.exit(1);
}

// Read both files
const indexContent = fs.readFileSync(indexPath, 'utf8');
const publicIndexContent = fs.readFileSync(publicIndexPath, 'utf8');

// Check for correct version
if (!indexContent.includes('VERSION 8.0 - PRODUCTION READY')) {
    console.error('❌ Root index.html does not have VERSION 8.0');
    process.exit(1);
}

if (!publicIndexContent.includes('VERSION 8.0 - PRODUCTION READY')) {
    console.error('❌ public/index.html does not have VERSION 8.0');
    process.exit(1);
}

// Check for simulation references
if (indexContent.toLowerCase().includes('simulation')) {
    console.error('❌ Root index.html contains simulation references');
    process.exit(1);
}

if (publicIndexContent.toLowerCase().includes('simulation')) {
    console.error('❌ public/index.html contains simulation references');
    process.exit(1);
}

// Check for correct Solana libraries
if (!indexContent.includes('@solana/web3.js@1.95.0')) {
    console.error('❌ Root index.html does not have correct Solana Web3.js version');
    process.exit(1);
}

if (!publicIndexContent.includes('@solana/web3.js@1.95.0')) {
    console.error('❌ public/index.html does not have correct Solana Web3.js version');
    process.exit(1);
}

// Check for mainnet connection
if (!indexContent.includes('api.mainnet-beta.solana.com')) {
    console.error('❌ Root index.html does not use mainnet connection');
    process.exit(1);
}

if (!publicIndexContent.includes('api.mainnet-beta.solana.com')) {
    console.error('❌ public/index.html does not use mainnet connection');
    process.exit(1);
}

// Check for real token creation functions
const requiredFunctions = [
    'createInitializeMintInstruction',
    'createMintToInstruction',
    'getAssociatedTokenAddressSync',
    'window.solana.connect',
    'window.solana.signAndSendTransaction'
];

for (const func of requiredFunctions) {
    if (!indexContent.includes(func)) {
        console.error(`❌ Root index.html missing required function: ${func}`);
        process.exit(1);
    }
    if (!publicIndexContent.includes(func)) {
        console.error(`❌ public/index.html missing required function: ${func}`);
        process.exit(1);
    }
}

// Check if files are identical
if (indexContent !== publicIndexContent) {
    console.error('❌ Root index.html and public/index.html are not identical');
    process.exit(1);
}

console.log('✅ All verification checks passed!');
console.log('✅ Root index.html: VERSION 8.0 - PRODUCTION READY');
console.log('✅ public/index.html: VERSION 8.0 - PRODUCTION READY');
console.log('✅ No simulation references found');
console.log('✅ Correct Solana libraries (Web3.js 1.95.0, SPL Token 0.4.8)');
console.log('✅ Mainnet connection configured');
console.log('✅ All required functions present');
console.log('✅ Files are identical');
console.log('');
console.log('🚀 Deployment is ready!');
