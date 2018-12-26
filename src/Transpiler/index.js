import fs from 'fs';
import path from 'path';
import vm from 'vm';
import get from 'lodash/get';
import last from 'lodash/last';
import requiredParam from '../statics/requiredParam';
import getMatches from './getMatches';
import replaceMatches from './replaceMatches';
import Prefix from '../Prefix/Prefix';
import getRelativePath from '../statics/getRelativePath';
import changeRelativeModuleDirectory from '../statics/changeRelativeModuleDirectory';
import matchesToSingleArray from './matchesToSingleArray';
import Sandbox from './Sandbox';
import IncludedFiles from '../IncludedFiles';
import assertIncludedFileSignature from '../assertions/assertIncludedFileSignature';

class Transpiler {
  constructor({
    hcl = requiredParam('hcl'),
    deploymentParams = requiredParam('deploymentParams'),
    sourceFile = requiredParam('sourceFile'),
    deployFolder = requiredParam('deployFolder'),
    rootFolder = requiredParam('rootFolder'),
    alreadyIncludedFiles = new IncludedFiles(),
  }) {
    this.hcl = hcl;
    this.deploymentParams = deploymentParams;
    this.sourceFile = sourceFile;
    this.deployFolder = deployFolder;
    this.rootFolder = rootFolder;
    this.alreadyIncludedFiles = alreadyIncludedFiles;

    this.includes = [];
    this.inserts = [];
    this.inplaceInserts = [];
    this.references = [];
  }

  addDeploymentPlatform = ({ newDeploymentParams, log }) => {
    console.log(
      `As the folloing: ${log}\n`,
      'is referenced under another platform',
      'this needs to be deployed separately',
    );
    /* @todo maybe add functionality for adding deployment platform */
    /* this should result in a new folder being added to the dist folder */
  };

  addRemoteStateReference = ({}) => {};

  addInclude = (params) => {
    assertIncludedFileSignature(params, this.addInclude);
    if (!this.alreadyIncludedFiles.hasInclude(params)) {
      this.includes.push(params);
      this.alreadyIncludedFiles.maybeAdd(params);
    }
  };

  addInsert = ({
    hcl = requiredParam('hcl'),
    deploymentParams = requiredParam('deploymentParams'),
  }) => {
    this.inserts.push({ hcl, deploymentParams });
  };

  addInplaceInsert = ({
    value = requiredParam('value'),
    id = requiredParam('id'),
  }) => {
    this.inplaceInserts.push({
      value,
      id,
    });
  };

  registerReference = ({
    sourceFile = requiredParam('sourceFile'),
    type = requiredParam('type'),
    name = requiredParam('name'),
    key = requiredParam('key'),
    deploymentParams = requiredParam('deploymentParams'),
  }) => {
    /* @todo, here we can maybe check if the referenced resource exists */
  };

  evalScripts(scripts) {
    scripts.forEach(({ code, id, line }) => {
      const sandbox = new Sandbox({
        id,
        deploymentParams: this.deploymentParams,
        sourceFile: this.sourceFile,
        rootFolder: this.rootFolder,

        addDeploymentPlatform: this.addDeploymentPlatform,
        addRemoteStateReference: this.addRemoteStateReference,

        addInclude: this.addInclude,
        addInsert: this.addInsert,
        addInplaceInsert: this.addInplaceInsert,
        registerReference: this.registerReference,
      });
      const context = sandbox.getContext();
      vm.createContext(context); // Contextify the sandbox.
      try {
        vm.runInContext(code, context);
      } catch (err) {
        console.log(code, `@ line ${line} in ${this.sourceFile}`);
        throw new Error(err.stack);
      }
    });
  }

  newChildInstance = ({
    hcl = requiredParam('hcl'),
    deploymentParams = requiredParam('deploymentParams'),
    sourceFile = requiredParam('sourceFile'),
  }) =>
    new Transpiler({
      hcl,
      deploymentParams: {
        deploymentParams,
        ...this.deploymentParams,
      },
      sourceFile,
      rootFolder: this.rootFolder,
      deployFolder: this.deployFolder,
      alreadyIncludedFiles: this.alreadyIncludedFiles,
    });

  parse() {
    if (this.parseResult) {
      return this.parseResult;
    }

    const matches = matchesToSingleArray(getMatches('```', this.hcl));

    /* This will be a bunch of side effects */
    this.evalScripts(
      matches
        .map((props) => ({ ...props, id: props.index }))
        .filter(({ type }) => type === 'match'),
    );

    const includes = this.includes.map(({ fpath, deploymentParams }) => {
      const hcl = fs.readFileSync(fpath).toString();
      return this.newChildInstance({
        hcl,
        deploymentParams,
        sourceFile: fpath,
      }).parse();
    });

    const inserts = this.inserts.map(({ hcl, deploymentParams }) =>
      this.newChildInstance({
        hcl,
        deploymentParams,
        sourceFile: this.sourceFile,
      }).parse());

    const inplaceInserts = this.inplaceInserts.reduce(
      (a, { value, id }) => ({
        ...a,
        [id]: a[id] ? `${a[id]}\n${value}` : value,
      }),
      {},
    );
    let parsedHcl = replaceMatches({
      hcl: this.hcl,
      matches,
      matcher: '```',
      replacer: ({ code, type, index }) => {
        if (type === 'match') {
          return inplaceInserts[index];
        }

        const prefixer = new Prefix({
          hcl: code,
          relativeSourceFile: getRelativePath(this.rootFolder, this.sourceFile),
        });
        const prefixedHcl = prefixer.prefix();
        const bakedHcl = changeRelativeModuleDirectory({
          hcl: prefixedHcl,
          oldFolder: path.parse(this.sourceFile).dir,
          newFolder: this.deployFolder,
        });
        return bakedHcl;
      },
    });

    parsedHcl += includes.join('\n');
    parsedHcl += inserts.join('\n');

    this.parseResult = parsedHcl;
    return this.parseResult;
  }
}

export default Transpiler;
