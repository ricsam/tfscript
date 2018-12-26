import assertDeploymentParamsSignature from './assertions/assertDeploymentParamsSignature';
import requiredParam from './statics/requiredParam';
import throwError from './statics/throwError';

function requireSignature(
  props,
  stacktraceFunction = requiredParam('stacktraceFunction'),
) {
  if (!props || !props.fpath || !props.deploymentParams) {
    throwError('Incorrect signature of the props', stacktraceFunction);
  }

  assertDeploymentParamsSignature(props.deploymentParams, stacktraceFunction);

  return props;
}

class IncludedFiles {
  files = [];

  hasInclude(props) {
    requireSignature(props, this.hasInclude);
    const { fpath, deploymentParams } = props;
    return !!this.files.find(
      (fileProps) =>
        fileProps.fpath === fpath
        && fileProps.deploymentParams.platform === deploymentParams.platform,
    );
  }

  maybeAdd(props) {
    requireSignature(props, this.maybeAdd);
    if (!this.hasInclude(props)) {
      this.files.push(props);
    }
  }
}

export default IncludedFiles;
