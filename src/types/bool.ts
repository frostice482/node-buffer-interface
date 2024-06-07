import BufInt from "../index.js";

const valueTrue = new Uint8Array([1]),
	valueFalse = new Uint8Array([0]);

const booleanBufInt: BufInt<boolean> = {
	*serialize(value) {
		yield value ? valueTrue : valueFalse;
	},
	serializeSync(value, chunks) {
		chunks.push(value ? valueTrue : valueFalse)
	},
	deserialize(buf, offset) {
		return {
			value: buf[offset] === 1,
			offset: offset + 1,
		};
	},
};

export default booleanBufInt
