import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function verifyBuild() {
  try {
    console.log('🔧 Verifying BillableAI extension build...');
    
    const distDir = path.join(__dirname, 'dist');
    
    // Required files for the extension
    const requiredFiles = [
      'manifest.json',
      'background.js',
      'tracking-script.js',
      'popup.html',
      'popup.css',
      'popup.js'
    ];
    
    // Required directories
    const requiredDirs = [
      'images'
    ];
    
    console.log('\n📁 Checking required files:');
    let allFilesPresent = true;
    
    requiredFiles.forEach(file => {
      const filePath = path.join(distDir, file);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log(`✅ ${file} (${stats.size} bytes)`);
      } else {
        console.log(`❌ ${file} - MISSING`);
        allFilesPresent = false;
      }
    });
    
    console.log('\n📁 Checking required directories:');
    let allDirsPresent = true;
    
    requiredDirs.forEach(dir => {
      const dirPath = path.join(distDir, dir);
      if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
        const files = fs.readdirSync(dirPath);
        console.log(`✅ ${dir}/ (${files.length} files)`);
        files.forEach(file => {
          console.log(`   - ${file}`);
        });
      } else {
        console.log(`❌ ${dir}/ - MISSING`);
        allDirsPresent = false;
      }
    });
    
    // Check manifest.json content
    console.log('\n📋 Checking manifest.json:');
    const manifestPath = path.join(distDir, 'manifest.json');
    if (fs.existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        console.log(`✅ Manifest version: ${manifest.manifest_version}`);
        console.log(`✅ Extension name: ${manifest.name}`);
        console.log(`✅ Extension version: ${manifest.version}`);
        
        // Check content scripts
        if (manifest.content_scripts && manifest.content_scripts.length > 0) {
          console.log(`✅ Content scripts configured: ${manifest.content_scripts.length}`);
          manifest.content_scripts.forEach((script, index) => {
            console.log(`   Script ${index + 1}: ${script.js.join(', ')}`);
            console.log(`   Matches: ${script.matches.join(', ')}`);
          });
        } else {
          console.log('❌ No content scripts configured');
        }
        
        // Check background script
        if (manifest.background && manifest.background.service_worker) {
          console.log(`✅ Background script: ${manifest.background.service_worker}`);
        } else {
          console.log('❌ No background script configured');
        }
        
      } catch (error) {
        console.log(`❌ Error parsing manifest.json: ${error.message}`);
      }
    }
    
    console.log('\n🎯 Build Verification Summary:');
    if (allFilesPresent && allDirsPresent) {
      console.log('✅ All required files and directories are present');
      console.log('✅ Extension should load properly in Chrome');
      console.log('\n📖 Next steps:');
      console.log('1. Go to chrome://extensions/');
      console.log('2. Enable Developer mode');
      console.log('3. Click "Load unpacked"');
      console.log('4. Select the dist folder');
    } else {
      console.log('❌ Some required files are missing');
      console.log('❌ Extension may not load properly');
      console.log('\n🔧 Run: npm run build:extension');
    }
    
  } catch (error) {
    console.error('❌ Error verifying build:', error);
    process.exit(1);
  }
}

// Run verification
verifyBuild(); 