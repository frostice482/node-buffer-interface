import BufInt from "../index.js";
import numberBufInt, { BufUintTypes, NumberBufInt } from "./number.js";

const { RangeError } = globalThis
const buf_from = Buffer.from

function stringBufInt(sizeType: BufUintTypes | NumberBufInt = "uint32be", encoding: BufferEncoding = "utf8"): BufInt<string> {
	const { bytes, max, encodeNum, readCall } = typeof sizeType === 'string' ? numberBufInt[sizeType] : sizeType;
	return {
		*serialize(v) {
			// encode string, check length
			const buf = buf_from(v, encoding);
			const len = buf.length;
			if (len > max) throw RangeError(`Range is outside max (${len} > ${max})`);

			// encode length, return buffer
			yield encodeNum(len);
			yield buf;
		},
		serializeSync(v, chunks) {
			// encode string, check length
			const buf = buf_from(v, encoding);
			const len = buf.length;
			if (len > max) throw RangeError(`Range is outside max (${len} > ${max})`);

			// encode length, return buffer
			chunks.push(encodeNum(len), buf);
		},
		deserialize(buf, offset) {
			// get length
			const len = readCall(buf, offset);
			offset += bytes;

			// get buffer, decode
			const sub = buf.subarray(offset, offset + len) as Buffer;
			return { value: sub.toString(encoding), offset: offset + len };
		},
	};
}

namespace stringBufInt {
	export const utf8_8 = stringBufInt("uint8", "utf8");
	export const utf8_16be = stringBufInt("uint16be", "utf8");
	export const utf8_32be = stringBufInt("uint32be", "utf8");
	export const binary_8 = stringBufInt("uint8", "binary");
}

export default stringBufInt
