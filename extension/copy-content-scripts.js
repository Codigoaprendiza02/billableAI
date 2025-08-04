import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function copyContentScripts() {
  try {
    console.log('🔧 Copying content scripts to dist directory...');
    
    const publicDir = path.join(__dirname, 'public');
    const distDir = path.join(__dirname, 'dist');
    
         // Files to copy
                       const filesToCopy = [
        'tracking-script.js',
        'tracking-script-modular.js',
        'tracking-script-simple.js',
        'tracking-script-basic.js',
        'tracking-core.js',
        'tracking-gmail-api.js',
        'tracking-gemini.js',
        'tracking-events.js',
        'tracking-detection.js',
        'background.js',
        'manifest.json',
        'popup.html'
        // Note: popup.js and popup.css are built by Vite, don't copy from public
      ];
    
    // Create dist directory if it doesn't exist
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }
    
    // Copy each file
    filesToCopy.forEach(file => {
      const sourcePath = path.join(publicDir, file);
      const destPath = path.join(distDir, file);
      
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`✅ Copied ${file}`);
      } else {
        console.log(`⚠️  File not found: ${file}`);
      }
    });
    
    // Copy images directory if it exists
    const imagesSource = path.join(publicDir, 'images');
    const imagesDest = path.join(distDir, 'images');
    
    if (fs.existsSync(imagesSource)) {
      if (!fs.existsSync(imagesDest)) {
        fs.mkdirSync(imagesDest, { recursive: true });
      }
      
      const imageFiles = fs.readdirSync(imagesSource);
      imageFiles.forEach(file => {
        const sourcePath = path.join(imagesSource, file);
        const destPath = path.join(imagesDest, file);
        fs.copyFileSync(sourcePath, destPath);
        console.log(`✅ Copied images/${file}`);
      });
    }
    
    console.log('🎉 Content scripts copied successfully!');
    
  } catch (error) {
    console.error('❌ Error copying content scripts:', error);
    process.exit(1);
  }
}

// Run the copy
copyContentScripts(); 