"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.BigInt = BigInt;
const index_1 = require("../symbols/index");
/** `[JavaScript]` Creates a BigInt type */
function BigInt(options = {}) {
    return {
        ...options,
        [index_1.Kind]: 'BigInt',
        type: 'bigint',
    };
}
