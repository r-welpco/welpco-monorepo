const nodeExternals = require('webpack-node-externals');

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
  ],
});
