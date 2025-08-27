<img src="./docs/logo.png" style="height:64px;margin-right:32px"/>

---

### **🚀 A blazingly fast Node.js library for parsing Lua 5.1 bytecode files into readable chunk structures**

LuaJS is a powerful and efficient library that allows you to decode compiled Lua bytecode (`.luac` files) into structured JavaScript objects, making it easy to analyze, inspect, and work with Lua bytecode programmatically.

## Features

- **Bytecode Parsing**: Decode binary `.luac` files into readable chunk tree structures
- **Robust Processing**: Works even with debug information stripped from bytecode
- **Verbose Instructions**: Optional detailed instruction analysis including instruction types (`AsBx`, `ABC`) and opcode names (`MOVE`, `LOADK`, etc.)
- **High Performance**: Optimized for speed with minimal memory footprint
- **Lua 5.1 Support**: Compatible with Lua 5.1 bytecode format
- **Lightweight**: Only **1 external** dependency


## 📦 Installation

```bash
npm install @xbcq1490/luajs
```


## 🚀 Quick Start

```javascript
const fs = require("fs");
const luajs = require("@xbcq1490/luajs");

// Read a compiled Lua bytecode file
const bytecode = fs.readFileSync("script.luac");

// Parse with basic options
const chunk = luajs.parse(bytecode, { verboseInstr: false });

// Parse with verbose instruction details
const verboseChunk = luajs.parse(bytecode, { verboseInstr: true });

console.log(JSON.stringify(chunk, null, 2));
```


## 📖 Usage Examples

### Basic Parsing

```javascript
const luajs = require("@xbcq1490/luajs");
const fs = require("fs");

const bytecode = fs.readFileSync("script.luac");
const result = luajs.parse(bytecode, { verboseInstr: false });

console.log("Constants:", result.constants);
console.log("Instructions:", result.instructions);
console.log("Prototypes:", result.prototypes.length);
```


### Verbose Instruction Analysis

```javascript
const luajs = require("@xbcq1490/luajs");
const fs = require("fs");

const bytecode = fs.readFileSync("script.luac");
const result = luajs.parse(bytecode, { verboseInstr: true });

result.instructions.forEach((instr, index) => {
  console.log(`${index}: ${instr.opcodeName} (${instr.instructionType})`);
});
```


### Working with Nested Prototypes

```javascript
const luajs = require("@xbcq1490/luajs");
const fs = require("fs");

function analyzePrototype(proto, depth = 0) {
  const indent = ("  ").repeat(depth);
  console.log(`${indent}Prototype:`);
  console.log(`${indent}  Source: ${proto.sourceName || "unknown"}`);
  console.log(`${indent}  Instructions: ${proto.instructions.length}`);
  console.log(`${indent}  Constants: ${proto.constants.length}`);
  
  proto.prototypes.forEach(child => {
    analyzePrototype(child, depth + 1);
  });
}

const bytecode = fs.readFileSync("script.luac");
const result = luajs.parse(bytecode, { verboseInstr: true });
analyzePrototype(result);
```


## 📋 API Reference

### `luajs.parse(buffer, options)`

Parses a Lua bytecode buffer into a structured chunk object.

#### Parameters

- **`buffer`** (`Buffer`): The bytecode buffer to parse
- **`options`** (`Object`): Parsing options
    - **`verboseInstr`** (`boolean`): If `true`, includes detailed instruction information (opcode names, instruction types). Default: `false`


#### Returns

Returns a chunk object with the following structure:

```javascript
{
  byteString: String,        // Original bytecode (only in top proto)
  sourceName: String|null,   // Source file name
  lineDefined: Number,       // Starting line number
  lastLineDefined: Number,   // Ending line number
  numUpvalues: Number,       // Number of upvalues
  numParams: Number,         // Number of parameters
  isVararg: Number,          // Vararg flag
  maxStackSize: Number,      // Maximum stack size
  instructions: Array,       // Instructions
  constants: Array,          // Constants
  prototypes: Array          // Nested function prototypes
}
```


#### Instruction Format

When `verboseInstr` is `true`, each instruction includes:

```javascript
{
  instr: Number,           // Raw instruction value
  opcode: Number,          // Opcode number
  instructionType: String, // Instruction type (ABC, ABx, AsBx)
  opcodeName: String       // Human-readable opcode name
}
```

Otherwise it just returns the instruction itself
```javascript
16449
```

## ⚠️ Requirements \& Limitations

- **Node.js**: Requires Node.js 8.0 or higher
- **Lua Version**: Only supports Lua 5.1 bytecode format
- **Endianness**: Only little-endian bytecode is supported

## 🔧 Error Handling

LuaJs performs validation on the header and will throw descriptive errors for:

- Invalid bytecode signatures
- Unsupported Lua versions
- Incompatible bytecode formats
- Corrupted or modified binaries

```javascript
try {
  const result = luajs.parse(bytecode, options);
} catch (error) {
  console.error("Parsing failed:", error.message);
}
```


## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🐛 Issues

If you encounter any issues or have feature requests, please file them on the [GitHub issues page](https://github.com/xbcq1490/LuaJs/issues).

***

**Made with ❤️ for the Lua community**
