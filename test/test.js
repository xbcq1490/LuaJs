const luaJs = require("../index.js");
const luaBin = require("fs").readFileSync("./luac.out");

const chunkTree = luaJs.parse(luaBin, {verboseInstr: true})

console.log(chunkTree)