"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var model_1 = require("./model");
/** Convert a primitive type from avro to TypeScript */
function convertPrimitive(avroType) {
    switch (avroType) {
        case "long":
        case "int":
        case "double":
        case "float":
            return "number";
        case "bytes":
            return "Buffer";
        case "null":
            return "null | undefined";
        case "boolean":
            return "boolean";
        default:
            return null;
    }
}
exports.convertPrimitive = convertPrimitive;
/** Convert an Avro Record type. Return the name, but add the definition to the file */
function convertRecord(recordType, fileBuffer) {
    var buffer = "export interface " + recordType.name + " {\n";
    for (var _i = 0, _a = recordType.fields; _i < _a.length; _i++) {
        var field = _a[_i];
        buffer += convertFieldDec(field, fileBuffer) + "\n";
    }
    buffer += "}\n";
    fileBuffer.push(buffer);
    return recordType.name;
}
exports.convertRecord = convertRecord;
/** Convert an Avro Enum type. Return the name, but add the definition to the file */
function convertEnum(enumType, fileBuffer) {
    var enumDef = "export enum " + enumType.name + " { " + enumType.symbols.join(", ") + " };\n";
    fileBuffer.push(enumDef);
    return enumType.name;
}
exports.convertEnum = convertEnum;
function convertType(type, buffer) {
    // if it's just a name, then use that
    if (typeof type === "string") {
        return convertPrimitive(type) || type;
    }
    else if (type instanceof Array) {
        // array means a Union. Use the names and call recursively
        return type.map(function (t) { return convertType(t, buffer); }).join(" | ");
    }
    else if (model_1.isRecordType(type)) {
        // record, use the name and add to the buffer
        return convertRecord(type, buffer);
    }
    else if (model_1.isArrayType(type)) {
        // array, call recursively for the array element type
        return convertType(type.items, buffer) + "[]";
    }
    else if (model_1.isMapType(type)) {
        // Dictionary of types, string as key
        return "{ [index:string]:" + convertType(type.values, buffer) + " }";
    }
    else if (model_1.isEnumType(type)) {
        // array, call recursively for the array element type
        return convertEnum(type, buffer);
    }
    else {
        console.error("Cannot work out type", type);
        return "UNKNOWN";
    }
}
exports.convertType = convertType;
function convertFieldDec(field, buffer) {
    // Union Type
    return "\t" + field.name + ": " + convertType(field.type, buffer) + ";";
}