import { join } from 'path';
import glob from 'glob';
import ScriptParser from '../Transpiler';
import IncludedFiles from '../IncludedFiles';

class Traverser {
  constructor({ fs, rootFolder }) {
    this.fs = fs;
    this.rootFolder = rootFolder;
  }

  concatFiles() {
    const alreadyIncludedFiles = new IncludedFiles();
    const files = glob.sync(join(this.rootFolder, '**', 'entry.tf'));
    files.map((file) => {
      const hcl = this.fs.readFileSync(file);
      const hclParser = new ScriptParser({
        hcl,
        deploymentParams: {
          project: 'wefwef',
          platform: 'omgomg',
          environment: 'stage',
          version: '123',
        },
        sourceFile: join(__dirname, 'main.tf'),
        rootFolder: __dirname,
        deployFolder: join(__dirname, '../'),
        alreadyIncludedFiles,
      });
      const result = hclParser.parse();
      return result;
    });
  }
}

export default Traverser;
