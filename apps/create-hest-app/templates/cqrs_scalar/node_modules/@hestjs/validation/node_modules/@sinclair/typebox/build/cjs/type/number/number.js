"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.Number = Number;
const index_1 = require("../symbols/index");
/** `[Json]` Creates a Number type */
function Number(options = {}) {
    return {
        ...options,
        [index_1.Kind]: 'Number',
        type: 'number',
    };
}
