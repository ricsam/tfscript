import assertExactKeys from './assertExactKeys';
import assertDeploymentParamsSignature from './assertDeploymentParamsSignature';
import requiredParam from '../statics/requiredParam';

const assertIncludedFileSignature = (
  props,
  stacktraceFunction = requiredParam('stacktraceFunction'),
) => {
  if (!props || !props.fpath || !props.deploymentParams) {
    const error = new Error('Incorrect signature of the included file');
    throw error;
  }

  assertDeploymentParamsSignature(props.deploymentParams, stacktraceFunction);
  assertExactKeys(props, ['fpath', 'deploymentParams'], stacktraceFunction);

  return props;
};

export default assertIncludedFileSignature;
