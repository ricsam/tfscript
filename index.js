#!/usr/bin/env node
import program from 'commander';
import { join } from 'path';
import pkgDir from 'pkg-dir';
import { readFileSync } from 'fs';
import glob from 'glob';
import parseDir from './cli/utils/parseDir';

program.version('0.0.1');

program
  .command('build [dir]')
  .description('Build the project')
  .action((dir) => {
    const entry = parseDir(dir);
    const files = glob.sync(join(entry, '**', 'index.tf'));
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
