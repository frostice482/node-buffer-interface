import BufInt from "../index.js";
import numberBufInt, { BufUintTypes, NumberBufInt } from "./number.js";

const { RangeError, Array } = globalThis

export default function arrayBufInt<Des, Ser>(bufint: BufInt<Des, Ser>, sizeType: BufUintTypes | NumberBufInt = "uint32be"): BufInt<Des[], ArrayLike<Ser> | Iterable<Ser>> {
	const { bytes, max, encodeNum, readCall } = typeof sizeType === 'string' ? numberBufInt[sizeType] : sizeType;

	return {
		*serialize(array) {
			if (Symbol.iterator in array) array = Array.from(array) as ArrayLike<Ser>

			// check length
			const len = array.length;
			if (len > max) throw RangeError(`Range is outside max (${len} > ${max})`);

			// encode length & array contents
			yield encodeNum(len);
			for (let i = 0; i < len; i++) yield* bufint.serialize(array[i]!);
		},
		serializeSync(array, chunks) {
			if (Symbol.iterator in array) array = Array.from(array) as ArrayLike<Ser>
			
			// check length
			const len = array.length;
			if (len > max) throw RangeError(`Range is outside max (${len} > ${max})`);

			// encode length & array contents
			chunks.push(encodeNum(len));
			for (let i = 0; i < len; i++) bufint.serializeSync(array[i]!, chunks);
		},
		deserialize(buf, offset, state) {
			// get length
			const len = readCall(buf, offset);
			offset += bytes;

			// decode array contents
			const arr = Array(len);
			for (let i = 0; i < len; i++) {
				const e = bufint.deserialize(buf, offset, state);
				offset = e.offset;
				arr[i] = e.value;
			}

			return { value: arr, offset };
		},
	};
}
