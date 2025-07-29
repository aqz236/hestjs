"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.Void = Void;
const index_1 = require("../symbols/index");
/** `[JavaScript]` Creates a Void type */
function Void(options = {}) {
    return {
        ...options,
        [index_1.Kind]: 'Void',
        type: 'void',
    };
}
