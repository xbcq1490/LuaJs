const { SmartBuffer } = require("smart-buffer");
const opcodes = require("./opcodes");

function assert(condition, errorMessage) {
	if (!condition) {
		throw new TypeError(errorMessage);
	}
}

function parseHeader(reader, bytecode) {
	assert(
		bytecode.slice(0, 4).toString() === "\x1bLua",
		"Not a valid Lua bytecode file (invalid signature)"
	);
	reader.readOffset = 4;
	assert(
		reader.readUInt8() === 0x51,
		"Unsupported Lua version. Only 5.1 is supported."
	);
	assert(
		reader.readUInt8() === 0,
		"Unsupported non-official Lua chunk format."
	);
	assert(
		reader.readUInt8() === 1,
		"Only little-endian bytecode is supported."
	);
	assert(
		reader.readUInt8() === 4,
		"Unsupported int size in bytecode (expected 4)."
	);
	const size_t_size = reader.readUInt8();
	assert(
		size_t_size === 4 || size_t_size === 8,
		"Unsupported size_t size in bytecode (expected 4 or 8)."
	);
	assert(
		reader.readUInt8() === 4,
		"Unsupported instruction size in bytecode (expected 4)."
	);
	assert(
		reader.readUInt8() === 8,
		"Unsupported number size in bytecode (expected 8)."
	);
	assert(
		reader.readUInt8() === 0,
		"Only non-integral (double) lua_Number supported."
	);
	return { sizeT: size_t_size };
}

function readSizeT(reader, sizeT) {
	if (sizeT === 4) return reader.readUInt32LE();
	const v = reader.readBigUInt64LE();
	const maxSafe = BigInt(Number.MAX_SAFE_INTEGER);
	if (v > maxSafe)
		throw new TypeError("size_t value exceeds JS safe integer range");
	return Number(v);
}

function readLuaString(reader, sizeT) {
	const n = readSizeT(reader, sizeT);
	if (n === 0) return null;
	const buf = reader.readBuffer(n);
	return buf.slice(0, n - 1).toString("utf8");
}

let reader;
let bytecode;
let options;
let top = 1;

function parsePrototype(reader, sizeT) {
	const proto = {};
	if (top == 1) proto.byteString = bytecode;
	proto.sourceName = readLuaString(reader, sizeT);
	proto.size_t_size = sizeT
	proto.lineDefined = reader.readUInt32LE();
	proto.lastLineDefined = reader.readUInt32LE();
	proto.numUpvalues = reader.readUInt8();
	proto.numParams = reader.readUInt8();
	proto.isVararg = reader.readUInt8();
	proto.maxStackSize = reader.readUInt8();

	// Instructions

	const instructionSize = reader.readUInt32LE();
	proto.instructions = [];

	for (let i = 0; i < instructionSize; i++) {
		if (options.verboseInstr) {
			const instruction = {
				instr: reader.readUInt32LE(),
			};
			instruction.opcode = instruction.instr % 64;
			instruction.instructionType =
				opcodes.instructionTypes[instruction.opcode];
			instruction.opcodeName = opcodes.opcodeNames[instruction.opcode];
			proto.instructions[i] = instruction;
		} else {
			// you like being simple.. do you?
			proto.instructions[i] = reader.readUInt32LE();
		}
	}

	// Constants

	const constantSize = reader.readUInt32LE();
	proto.constants = [];

	for (let i = 0; i < constantSize; i++) {
		const constantType = reader.readUInt8();
		if (constantType === 0) {
			proto.constants.push(null);
		} else if (constantType === 1) {
			proto.constants.push(reader.readUInt8() != 0);
		} else if (constantType === 3) {
			proto.constants.push(reader.readDoubleLE());
		} else if (constantType === 4) {
			proto.constants.push(readLuaString(reader, sizeT));
		}
	}

	// Prototypes

	const protoSize = reader.readUInt32LE();

	proto.prototypes = [];

	for (let i = 0; i < protoSize; i++) {
		top = 0;
		proto.prototypes.push(parsePrototype(reader, sizeT));
	}

	const lineInfoSize = reader.readUInt32LE();

	reader.readOffset += lineInfoSize * 4;

	const locVarSize = reader.readUInt32LE();
	for (let i = 0; i < locVarSize; i++) {
		readLuaString(reader, sizeT);
		reader.readUInt32LE();
		reader.readUInt32LE();
	}

	const upvalNameSize = reader.readUInt32LE();
	for (let i = 0; i < upvalNameSize; i++) {
		readLuaString(reader, sizeT);
	}

	return proto;
}

module.exports = {
	/**
	 * Parses a Lua 5.1 binary into a readable chunk
	 * @param {Buffer} buffer - The Lua binary buffer
	 * @param {Array} - Options (verboseInstr)
	 * @returns {Object} - Returns the chunk tree
	 */
	parse: function (buffer, opts) {
		reader = SmartBuffer.fromBuffer(buffer);
		bytecode = reader.toString();
		options = { verboseInstr: opts.verboseInstr ? true : false };
		return parsePrototype(reader, parseHeader(reader, bytecode));
	},
};
