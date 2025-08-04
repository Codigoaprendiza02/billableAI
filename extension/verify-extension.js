import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function verifyExtension() {
  console.log('🔍 Verifying BillableAI Extension files...\n');
  
  const distDir = path.join(__dirname, 'dist');
  
  // Required files
  const requiredFiles = [
    'manifest.json',
    'background.js',
    'tracking-script.js',
    'popup.html',
    'popup.js',
    'popup.css'
  ];
  
  let allGood = true;
  
  // Check if dist directory exists
  if (!fs.existsSync(distDir)) {
    console.log('❌ dist directory not found!');
    console.log('   Run: npm run build:extension');
    return false;
  }
  
  console.log('✅ dist directory found');
  
  // Check each required file
  requiredFiles.forEach(file => {
    const filePath = path.join(distDir, file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      console.log(`✅ ${file} (${stats.size} bytes)`);
    } else {
      console.log(`❌ ${file} - MISSING!`);
      allGood = false;
    }
  });
  
  // Check manifest.json content
  const manifestPath = path.join(distDir, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      console.log('\n📋 Manifest.json verification:');
      console.log(`   Name: ${manifest.name}`);
      console.log(`   Version: ${manifest.version}`);
      console.log(`   Permissions: ${manifest.permissions?.length || 0} permissions`);
      console.log(`   Content scripts: ${manifest.content_scripts?.length || 0} scripts`);
      
      // Check for required permissions
      const requiredPermissions = ['storage', 'activeTab', 'identity', 'tabs', 'scripting'];
      const missingPermissions = requiredPermissions.filter(p => !manifest.permissions?.includes(p));
      
      if (missingPermissions.length > 0) {
        console.log(`   ❌ Missing permissions: ${missingPermissions.join(', ')}`);
        allGood = false;
      } else {
        console.log('   ✅ All required permissions present');
      }
      
      // Check content scripts
      if (manifest.content_scripts && manifest.content_scripts.length > 0) {
        console.log('   ✅ Content scripts configured');
      } else {
        console.log('   ❌ No content scripts configured');
        allGood = false;
      }
      
    } catch (error) {
      console.log(`   ❌ Invalid manifest.json: ${error.message}`);
      allGood = false;
    }
  }
  
  // Check if images directory exists
  const imagesDir = path.join(distDir, 'images');
  if (fs.existsSync(imagesDir)) {
    const imageFiles = fs.readdirSync(imagesDir);
    console.log(`\n📁 Images directory: ${imageFiles.length} files`);
    imageFiles.forEach(file => {
      console.log(`   ✅ ${file}`);
    });
  } else {
    console.log('\n❌ Images directory missing');
    allGood = false;
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (allGood) {
    console.log('🎉 Extension files are correct!');
    console.log('📋 Next steps:');
    console.log('   1. Go to chrome://extensions/');
    console.log('   2. Enable Developer mode');
    console.log('   3. Click "Load unpacked"');
    console.log('   4. Select the dist folder');
    console.log('   5. Test with test-simple-extension.html');
  } else {
    console.log('❌ Extension files have issues!');
    console.log('📋 Fix the missing files and run: npm run build:extension');
  }
  
  return allGood;
}

// Run verification
verifyExtension(); 