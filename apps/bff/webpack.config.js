const nodeExternals = require('webpack-node-externals');

/** Keep native/SDK deps external when @welpco packages are bundled into the serverless artifact. */
function externalizeSdkRequest({ request }, callback) {
  if (
    request === 'resend' ||
    (typeof request === 'string' && request.startsWith('resend/')) ||
    request === 'twilio' ||
    (typeof request === 'string' && request.startsWith('twilio/'))
  ) {
    return callback(null, `commonjs ${request}`);
  }
  callback();
}

/**
 * Nest defaults externalize all node_modules. On Vercel, workspace packages
 * (@welpco/*) must be bundled — otherwise runtime resolves package.json "main"
 * from node_modules and fails when dist/ is missing or cached metadata is stale.
 */
module.exports = (options) => ({
  ...options,
  externals: [
    nodeExternals({
      allowlist: [/^@welpco\//],
    }),
    externalizeSdkRequest,
  ],
});
