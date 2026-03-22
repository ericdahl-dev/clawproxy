import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const projectRoot = process.cwd();
const standaloneRoot = path.join(projectRoot, '.next', 'standalone');

function copyIntoStandalone(relativeSourcePath, relativeDestinationPath = relativeSourcePath) {
  const sourcePath = path.join(projectRoot, relativeSourcePath);
  if (!fs.existsSync(sourcePath)) {
    return;
  }

  const destinationPath = path.join(standaloneRoot, relativeDestinationPath);
  fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
  fs.cpSync(sourcePath, destinationPath, { recursive: true });
}

copyIntoStandalone('public');
copyIntoStandalone(path.join('.next', 'static'));
