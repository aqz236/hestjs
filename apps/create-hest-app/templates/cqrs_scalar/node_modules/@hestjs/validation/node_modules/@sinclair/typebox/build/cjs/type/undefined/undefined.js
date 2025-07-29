"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.Undefined = Undefined;
const index_1 = require("../symbols/index");
/** `[JavaScript]` Creates a Undefined type */
function Undefined(options = {}) {
    return { ...options, [index_1.Kind]: 'Undefined', type: 'undefined' };
}
