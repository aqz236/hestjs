"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.Strict = Strict;
/** `[Json]` Omits compositing symbols from this schema. */
function Strict(schema) {
    return JSON.parse(JSON.stringify(schema));
}
