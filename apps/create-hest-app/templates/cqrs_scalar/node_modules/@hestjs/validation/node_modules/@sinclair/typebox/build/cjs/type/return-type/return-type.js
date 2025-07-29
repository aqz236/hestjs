"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.ReturnType = ReturnType;
const type_1 = require("../clone/type");
/** `[JavaScript]` Extracts the ReturnType from the given Function type */
function ReturnType(schema, options = {}) {
    return (0, type_1.CloneType)(schema.returns, options);
}
