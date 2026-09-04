import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

const pages = [
  'popup',
  'task-capture',
  'focus-lock',
  'side-panel',
  'options',
  'new-tab',
  'devtools',
  'devtools-panel',
];

const rootDist = path.join(rootDir, 'dist');

for (const page of pages) {
  const src = path.join(rootDir, 'pages', page, 'dist');
  const dest = path.join(rootDist, page);

  if (fs.existsSync(src)) {
    console.log(`Copying ${page}...`);
    fs.copySync(src, dest, { overwrite: true });
  }
}

// Copy content scripts
const contentSrc = path.join(rootDir, 'dist', 'content');
if (fs.existsSync(contentSrc)) {
  console.log('Content scripts already in dist');
}

console.log('✅ All pages copied to dist/');
