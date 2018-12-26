import { join } from 'path';
import fs from 'fs';

const parseDir = (rawDir) => {
  const dir = rawDir || '.';
  if (dir[0] === '.') {
    return join(process.cwd(), dir);
  }

  if (!fs.lstatSync(dir).isDirectory()) {
    throw new Error('Path must be root directory');
  }

  return dir;
};
export default parseDir;
