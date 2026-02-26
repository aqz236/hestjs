"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.Cast = Cast;
exports.Create = Create;
exports.Check = Check;
exports.Clean = Clean;
exports.Convert = Convert;
exports.Clone = Clone;
exports.Decode = Decode;
exports.Default = Default;
exports.Encode = Encode;
exports.Errors = Errors;
exports.Equal = Equal;
exports.Diff = Diff;
exports.Hash = Hash;
exports.Patch = Patch;
exports.Mutate = Mutate;
const index_1 = require("../transform/index");
const index_2 = require("../mutate/index");
const index_3 = require("../hash/index");
const index_4 = require("../equal/index");
const index_5 = require("../cast/index");
const index_6 = require("../clone/index");
const index_7 = require("../convert/index");
const index_8 = require("../create/index");
const index_9 = require("../clean/index");
const index_10 = require("../check/index");
const index_11 = require("../default/index");
const index_12 = require("../delta/index");
const index_13 = require("../../errors/index");
/** Casts a value into a given type. The return value will retain as much information of the original value as possible. */
function Cast(...args) {
    return index_5.Cast.apply(index_5.Cast, args);
}
/** Creates a value from the given type */
function Create(...args) {
    return index_8.Create.apply(index_8.Create, args);
}
/** Returns true if the value matches the given type */
function Check(...args) {
    return index_10.Check.apply(index_10.Check, args);
}
/** `[Mutable]` Removes excess properties from a value and returns the result. This function does not check the value and returns an unknown type. You should Check the result before use. Clean is a mutable operation. To avoid mutation, Clone the value first. */
function Clean(...args) {
    return index_9.Clean.apply(index_9.Clean, args);
}
/** Converts any type mismatched values to their target type if a reasonable conversion is possible. */
function Convert(...args) {
    return index_7.Convert.apply(index_7.Convert, args);
}
/** Returns a structural clone of the given value */
function Clone(value) {
    return (0, index_6.Clone)(value);
}
/** Decodes a value or throws if error */
function Decode(...args) {
    const [schema, references, value] = args.length === 3 ? [args[0], args[1], args[2]] : [args[0], [], args[1]];
    if (!Check(schema, references, value))
        throw new index_1.TransformDecodeCheckError(schema, value, Errors(schema, references, value).First());
    return (0, index_1.HasTransform)(schema, references) ? (0, index_1.TransformDecode)(schema, references, value) : value;
}
/** `[Mutable]` Generates missing properties on a value using default schema annotations if available. This function does not check the value and returns an unknown type. You should Check the result before use. Default is a mutable operation. To avoid mutation, Clone the value first. */
function Default(...args) {
    return index_11.Default.apply(index_11.Default, args);
}
/** Encodes a value or throws if error */
function Encode(...args) {
    const [schema, references, value] = args.length === 3 ? [args[0], args[1], args[2]] : [args[0], [], args[1]];
    const encoded = (0, index_1.HasTransform)(schema, references) ? (0, index_1.TransformEncode)(schema, references, value) : value;
    if (!Check(schema, references, encoded))
        throw new index_1.TransformEncodeCheckError(schema, encoded, Errors(schema, references, encoded).First());
    return encoded;
}
/** Returns an iterator for each error in this value. */
function Errors(...args) {
    return index_13.Errors.apply(index_13.Errors, args);
}
/** Returns true if left and right values are structurally equal */
function Equal(left, right) {
    return (0, index_4.Equal)(left, right);
}
/** Returns edits to transform the current value into the next value */
function Diff(current, next) {
    return (0, index_12.Diff)(current, next);
}
/** Returns a FNV1A-64 non cryptographic hash of the given value */
function Hash(value) {
    return (0, index_3.Hash)(value);
}
/** Returns a new value with edits applied to the given value */
function Patch(current, edits) {
    return (0, index_12.Patch)(current, edits);
}
/** `[Mutable]` Performs a deep mutable value assignment while retaining internal references. */
function Mutate(current, next) {
    (0, index_2.Mutate)(current, next);
}
