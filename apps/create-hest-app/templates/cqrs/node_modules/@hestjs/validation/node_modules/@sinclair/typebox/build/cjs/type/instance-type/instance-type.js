"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.InstanceType = InstanceType;
const type_1 = require("../clone/type");
/** `[JavaScript]` Extracts the InstanceType from the given Constructor type */
function InstanceType(schema, options = {}) {
    return (0, type_1.CloneType)(schema.returns, options);
}
