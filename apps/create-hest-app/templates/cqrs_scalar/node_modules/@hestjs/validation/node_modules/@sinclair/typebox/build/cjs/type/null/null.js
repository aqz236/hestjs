"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.Null = Null;
const index_1 = require("../symbols/index");
/** `[Json]` Creates a Null type */
function Null(options = {}) {
    return {
        ...options,
        [index_1.Kind]: 'Null',
        type: 'null',
    };
}
