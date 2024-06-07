import BufInt from "../index.js";

const bufProto = Buffer.prototype;

const int8_max = 0x7f;
const uint16_max = 0xffff;
const int16_max = 0x7fff;
const uint32_max = 0xffffffff;
const int32_max = 0x7fffffff;
const uint48_max = 0xffffffffffff;
const int48_max = 0x7fffffffffff;

const flt32_max = 1.9999999 * 2 ** 127;
const flt64_max = Number.MAX_VALUE;

export const BufIntMapDefs_Uint: UintMapDef[] = [
	{ key: "uint8", method: "UInt8", bytes: 1, max: 0xff },
	{ key: "uint16be", method: "UInt16BE", little: false, bytes: 2, max: uint16_max },
	{ key: "uint16le", method: "UInt16LE", little: true, bytes: 2, max: uint16_max },
	{ key: "uint32be", method: "UInt32BE", little: false, bytes: 4, max: uint32_max },
	{ key: "uint32le", method: "UInt32LE", little: true, bytes: 4, max: uint32_max },
	{ key: "uint48be", method: "UIntBE", little: false, bytes: 6, max: uint48_max },
	{ key: "uint48le", method: "UIntLE", little: true, bytes: 6, max: uint48_max },
];

export const BufIntMapDefs_Number: NumberMapDef[] = [
	{ key: "uint8", method: "UInt8", bytes: 1, min: 0, max: 0xff },
	{ key: "int8", method: "Int8", bytes: 1, min: ~int8_max, max: int8_max },
	{ key: "uint16be", method: "UInt16BE", little: false, bytes: 2, min: 0, max: uint16_max },
	{ key: "uint16le", method: "UInt16LE", little: true, bytes: 2, min: 0, max: uint16_max },
	{ key: "int16be", method: "Int16BE", little: false, bytes: 2, min: ~int16_max, max: int16_max },
	{ key: "int16le", method: "Int16LE", little: true, bytes: 2, min: ~int16_max, max: int16_max },
	{ key: "uint32be", method: "UInt32BE", little: false, bytes: 4, min: 0, max: uint32_max },
	{ key: "uint32le", method: "UInt32LE", little: true, bytes: 4, min: 0, max: uint32_max },
	{ key: "int32be", method: "Int32BE", little: false, bytes: 4, min: ~int32_max, max: int32_max },
	{ key: "int32le", method: "Int32LE", little: true, bytes: 4, min: ~int32_max, max: int32_max },
	{ key: "uint48be", method: "UIntBE", little: false, bytes: 6, min: 0, max: uint48_max },
	{ key: "uint48le", method: "UIntLE", little: true, bytes: 6, min: 0, max: uint48_max },
	{ key: "int48be", method: "IntBE", little: false, bytes: 6, min: ~int48_max, max: int48_max },
	{ key: "int48le", method: "IntLE", little: true, bytes: 6, min: ~int48_max, max: int48_max },
	{ key: "float32be", method: "FloatBE", little: false, bytes: 4, min: -flt32_max, max: flt32_max },
	{ key: "float32le", method: "FloatLE", little: true, bytes: 4, min: -flt32_max, max: flt32_max },
	{ key: "float64be", method: "DoubleBE", little: false, bytes: 8, min: -flt64_max, max: flt64_max },
	{ key: "float64le", method: "DoubleLE", little: true, bytes: 8, min: -flt64_max, max: flt64_max },
];

const numberBufInt: Record<BufNumberTypes, NumberBufInt> = Object.create(null);
export default numberBufInt

const { allocUnsafe } = Buffer

for (const { key: key, method: method, bytes, min, max } of BufIntMapDefs_Number) {
	const r = bufProto[("read" + method) as never] as never as (offset: number) => number;
	const w = bufProto[("write" + method) as never] as never as (value: number, offset?: number) => number;

	const readCall = r.call.bind(r) as BufNumReadCall<number>;
	const writeCall = w.call.bind(w) as BufNumWriteCall<number>;

	numberBufInt[key] = {
		*serialize(value) {
			const buf = allocUnsafe(bytes);
			writeCall(buf, value);
			yield buf;
		},

		serializeSync(value, chunks) {
			const buf = allocUnsafe(bytes);
			writeCall(buf, value);
			chunks.push(buf)
		},

		encodeNum(value) {
			const buf = allocUnsafe(bytes);
			writeCall(buf, value);
			return buf;
		},

		deserialize(buf, offset) {
			return {
				value: readCall(buf, offset),
				offset: offset + bytes,
			};
		},

		method,
		readCall,
		writeCall,

		bytes,
		min,
		max,
	};
}

export interface NumberBufInt<T = number> extends BufInt<T> {
	method: string;
	little?: boolean;

	encodeNum: (value: T) => Buffer;
	readCall: BufNumReadCall<T>;
	writeCall: BufNumWriteCall<T>;

	bytes: number;
	min: T;
	max: T;
}

export type BufNumberTypes = `${"u" | ""}int${8}` | `${"u" | ""}int${16 | 32 | 48}${"be" | "le"}` | `float${32 | 64}${"be" | "le"}`;
export type BufUintTypes = `uint8` | `uint${16 | 32 | 48}${"be" | "le"}`;

export interface MapDefStd {
	method: BufReadWriteKeys;
	little?: boolean;
	bytes: number;
	max: number;
}

interface NumberMapDef extends MapDefStd {
	min: number;
	key: BufNumberTypes;
}

interface UintMapDef extends MapDefStd {
	key: BufUintTypes;
}

export type BufReadWriteKeys = keyof Buffer extends infer R ? (R extends `${"read" | "write"}${infer V}` ? V : never) : never;
export type BufNumReadCall<T> = (thisArg: Buffer, offset: number) => T;
export type BufNumWriteCall<T> = (thisArg: Buffer, value: T, offset?: number) => number;
