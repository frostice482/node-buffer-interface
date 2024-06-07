import { BufNumReadCall, BufNumWriteCall, BufReadWriteKeys, NumberBufInt } from "./number.js";

const bufProto = Buffer.prototype;

const biguint64_max = 0xffffffffffffffffn
const bigint64_max = 0x7fffffffffffffffn
const bigint64_bytes = 8

export const numIntMapDefs: BufBigintMapDef[] = [
	{ key: "biguint64be", method: "BigUInt64BE", min: 0n, max: biguint64_max },
	{ key: "biguint64le", method: "BigUInt64LE", min: 0n, max: biguint64_max },
	{ key: "bigint64be", method: "BigInt64BE", min: ~bigint64_max, max: bigint64_max },
	{ key: "bigint64le", method: "BigInt64LE", min: ~bigint64_max, max: bigint64_max },
];

const bigintBufInt: Record<BufBigintTypes, NumberBufInt<bigint>> = Object.create(null);
export default bigintBufInt

const { allocUnsafe } = Buffer

for (const { key: key, method: method, min, max } of numIntMapDefs) {
	const r = bufProto[("read" + method) as never] as never as (offset: number) => bigint;
	const w = bufProto[("write" + method) as never] as never as (value: bigint, offset?: number) => number;

	const readCall = r.call.bind(r) as BufNumReadCall<bigint>;
	const writeCall = w.call.bind(w) as BufNumWriteCall<bigint>;

	bigintBufInt[key] = {
		*serialize(value) {
			const buf = allocUnsafe(bigint64_bytes);
			writeCall(buf, value);
			yield buf;
		},

		serializeSync(value, chunks) {
			const buf = allocUnsafe(bigint64_bytes);
			writeCall(buf, value);
			chunks.push(buf);
		},

		encodeNum(value) {
			const buf = allocUnsafe(bigint64_bytes);
			writeCall(buf, value);
			return buf;
		},

		deserialize(buf, offset) {
			return {
				value: readCall(buf, offset),
				offset: offset + bigint64_bytes,
			};
		},

		method,
		readCall,
		writeCall,

		bytes: bigint64_bytes,
		min,
		max,
	};
}

export interface BufBigintMapDef {
	key: BufBigintTypes;
	method: BufReadWriteKeys;
	min: bigint;
	max: bigint;
}

export type BufBigintTypes = `big${"u" | ""}int64${"be" | "le"}`
