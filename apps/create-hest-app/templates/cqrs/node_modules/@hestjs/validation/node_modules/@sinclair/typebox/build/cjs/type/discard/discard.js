"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.Discard = Discard;
function DiscardKey(value, key) {
    const { [key]: _, ...rest } = value;
    return rest;
}
function Discard(value, keys) {
    return keys.reduce((acc, key) => DiscardKey(acc, key), value);
}
