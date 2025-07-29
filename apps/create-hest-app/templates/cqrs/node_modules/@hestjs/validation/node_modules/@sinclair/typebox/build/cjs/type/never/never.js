"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.Never = Never;
const index_1 = require("../symbols/index");
/** `[Json]` Creates a Never type */
function Never(options = {}) {
    return {
        ...options,
        [index_1.Kind]: 'Never',
        not: {},
    };
}
