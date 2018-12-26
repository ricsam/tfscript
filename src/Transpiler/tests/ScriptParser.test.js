/* eslint-env jest */
import fs from 'fs';
import { join } from 'path';
import ScriptParser from '../index';
import HclPrettier from '../../HclPrettier';

const hcl = fs.readFileSync(join(__dirname, 'main.tf')).toString();

test('parsing scripts', async () => {
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
  });
  const result = hclParser.parse();
  const prettier = new HclPrettier(result);
  return prettier.format().then((prettyCode) => {
    // fs.writeFileSync(join(__dirname, './output.tf'), prettyCode);
    expect(prettyCode).toBe(
      fs.readFileSync(join(__dirname, './output.tf')).toString(),
    );
  })
});
