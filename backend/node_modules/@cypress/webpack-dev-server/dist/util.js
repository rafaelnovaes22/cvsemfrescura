"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isWebpackBundleAnalyzerEnabled = exports.WBADebugNamespace = void 0;
const tslib_1 = require("tslib");
const debug_1 = tslib_1.__importDefault(require("debug"));
exports.WBADebugNamespace = 'cypress-verbose:webpack-dev-server:bundle-analyzer';
const isWebpackBundleAnalyzerEnabled = () => {
    return debug_1.default.enabled(exports.WBADebugNamespace);
};
exports.isWebpackBundleAnalyzerEnabled = isWebpackBundleAnalyzerEnabled;
