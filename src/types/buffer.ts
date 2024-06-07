import BufInt from "../index.js";
import numberBufInt, { BufUintTypes, NumberBufInt } from "./number.js";

const { RangeError } = globalThis

function bufferBufInt(sizeType: BufUintTypes | NumberBufInt = "uint32be"): BufInt<Buffer, Buffer | Uint8Array> {
	const { bytes, max, encodeNum, readCall } = typeof sizeType == 'string' ? numberBufInt[sizeType] : sizeType;

	return {
		*serialize(v) {
			// check length
			const len = v.byteLength;
			if (len > max) throw RangeError(`Range is outside max (${len} > ${max})`);

			// encode length,return buffer
			yield encodeNum(len);
			yield v;
		},
		serializeSync(v, chunks) {
			// encode string, check length
			const len = v.byteLength;
			if (len > max) throw RangeError(`Range is outside max (${len} > ${max})`);

			// encode length, return buffer
			chunks.push(encodeNum(len), v);
		},
		deserialize(buf, offset) {
			// get length
			const len = readCall(buf, offset);
			offset += bytes;

			// get buffer
			const value = buf.subarray(offset, offset += len) as Buffer;
			return { value, offset };
		},
	};
}

namespace bufferBufInt {
	export const uint8 = bufferBufInt("uint8");
	export const uint16be = bufferBufInt("uint16be");
	export const uint32be = bufferBufInt("uint32be");
}

export default bufferBufInt
