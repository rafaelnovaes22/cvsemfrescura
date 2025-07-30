"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWebpackDevServer = void 0;
const tslib_1 = require("tslib");
const debug_1 = tslib_1.__importDefault(require("debug"));
const makeWebpackConfig_1 = require("./makeWebpackConfig");
const util_1 = require("./util");
const debug = (0, debug_1.default)('cypress:webpack-dev-server:start');
async function createWebpackDevServer(config) {
    const { sourceWebpackModulesResult: { webpack: { module: webpack, }, webpackDevServer: { majorVersion: webpackDevServerMajorVersion, }, }, } = config;
    const finalWebpackConfig = await (0, makeWebpackConfig_1.makeWebpackConfig)(config);
    const webpackCompiler = webpack(finalWebpackConfig);
    if (webpackDevServerMajorVersion === 5) {
        debug('using webpack-dev-server v5');
        return webpackDevServer5(config, webpackCompiler, finalWebpackConfig);
    }
    if (webpackDevServerMajorVersion === 4) {
        debug('using webpack-dev-server v4');
        return webpackDevServer4(config, webpackCompiler, finalWebpackConfig);
    }
    throw new Error(`Unsupported webpackDevServer version ${webpackDevServerMajorVersion}`);
}
exports.createWebpackDevServer = createWebpackDevServer;
function webpackDevServer5(config, compiler, finalWebpackConfig) {
    var _a;
    const { devServerConfig: { cypressConfig: { devServerPublicPathRoute } } } = config;
    const isOpenMode = !config.devServerConfig.cypressConfig.isTextTerminal;
    const WebpackDevServer = config.sourceWebpackModulesResult.webpackDevServer.module;
    const webpackDevServerConfig = Object.assign(Object.assign({ host: '127.0.0.1', port: 'auto' }, finalWebpackConfig === null || finalWebpackConfig === void 0 ? void 0 : finalWebpackConfig.devServer), { devMiddleware: Object.assign({ publicPath: devServerPublicPathRoute, stats: (_a = finalWebpackConfig.stats) !== null && _a !== void 0 ? _a : 'minimal' }, ((0, util_1.isWebpackBundleAnalyzerEnabled)() ? {
            // the bundle needs to be written to disk in order to determine source map sizes
            writeToDisk: true,
        } : {})), hot: false, 
        // Only enable file watching & reload when executing tests in `open` mode
        liveReload: isOpenMode });
    debug(WebpackDevServer);
    debug(webpackDevServerConfig);
    const server = new WebpackDevServer(webpackDevServerConfig, compiler);
    debug(server);
    return {
        server,
        compiler,
    };
}
function webpackDevServer4(config, compiler, finalWebpackConfig) {
    var _a;
    const { devServerConfig: { cypressConfig: { devServerPublicPathRoute } } } = config;
    const isOpenMode = !config.devServerConfig.cypressConfig.isTextTerminal;
    const WebpackDevServer = config.sourceWebpackModulesResult.webpackDevServer.module;
    const webpackDevServerConfig = Object.assign(Object.assign({ host: '127.0.0.1', port: 'auto' }, finalWebpackConfig === null || finalWebpackConfig === void 0 ? void 0 : finalWebpackConfig.devServer), { devMiddleware: Object.assign({ publicPath: devServerPublicPathRoute, stats: (_a = finalWebpackConfig.stats) !== null && _a !== void 0 ? _a : 'minimal' }, ((0, util_1.isWebpackBundleAnalyzerEnabled)() ? {
            // the bundle needs to be written to disk in order to determine source map sizes
            writeToDisk: true,
        } : {})), hot: false, 
        // Only enable file watching & reload when executing tests in `open` mode
        liveReload: isOpenMode });
    const server = new WebpackDevServer(webpackDevServerConfig, compiler);
    return {
        server,
        compiler,
    };
}
