"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.Boolean = Boolean;
const index_1 = require("../symbols/index");
/** `[Json]` Creates a Boolean type */
function Boolean(options = {}) {
    return {
        ...options,
        [index_1.Kind]: 'Boolean',
        type: 'boolean',
    };
}
