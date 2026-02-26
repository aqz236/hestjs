"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.Unknown = Unknown;
const index_1 = require("../symbols/index");
/** `[Json]` Creates an Unknown type */
function Unknown(options = {}) {
    return {
        ...options,
        [index_1.Kind]: 'Unknown',
    };
}
