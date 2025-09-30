"use strict";
/**
 * OpenRole Validation Package
 *
 * Centralized validation schemas for the OpenRole CV & Profile Tools
 *
 * @author OpenRole.net
 * @version 1.0.0
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cvSchemas = exports.profileSchemas = void 0;
// Export all profile validation schemas and types
__exportStar(require("./profile-schemas"), exports);
// Export all CV validation schemas and types
__exportStar(require("./cv-schemas"), exports);
// Re-export default schema collections
var profile_schemas_1 = require("./profile-schemas");
Object.defineProperty(exports, "profileSchemas", { enumerable: true, get: function () { return __importDefault(profile_schemas_1).default; } });
var cv_schemas_1 = require("./cv-schemas");
Object.defineProperty(exports, "cvSchemas", { enumerable: true, get: function () { return __importDefault(cv_schemas_1).default; } });
//# sourceMappingURL=index.js.map