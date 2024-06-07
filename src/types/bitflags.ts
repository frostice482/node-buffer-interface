import BufInt from "../index";
import { ReadonlyRecord } from "../localtypes.js";

const safeKeyRgx = /^(?!\d)[\w$]+$/i;

export default function bitflagsBufInt<T extends string>(flags: ArrayLike<T | false>): BufInt<Record<T, boolean>, ReadonlyRecord<T, boolean>> {
	const flagsLen = flags.length
	const bytes = Math.ceil(flagsLen / 8)

	if (bytes > 4) throw RangeError('BitFlags type can have up to 4 bytes max')

	/**
	 * inline serialize string
	 * ```
	 * [`($prop1 ? $bit1 : 0) | ($prop2 ? $bit2 : 0) | ...`, `($prop1 ? $bit1 : 0) | ...`, ...]
	 * ```
	 */
	const serializeStr = []
	/**
	 * Inline deserialize string
	 * ```
	 * ({ $key: ($byte & $bit) !== 0, ... })
	 * ```
	 */
	const deserializeStr = []
	/**
	 * byte declaration map
	 * ```
	 * byte0 = buf[offset+0], byte1 = buf[offset+1], ...
	 * ```
	 */
	const byteDeclMap = []

	for (let b = 0; b < bytes; b++) {
		const bitsSerialize = []
		const offset = b * 8

		const byteRef = `byte${b.toString(36)}`
		byteDeclMap.push(`${byteRef} = buf[offset+${b}]`)

		for (let j = 0; j < 8; j++) {
			const flag = flags[j + offset]
			if (flag === undefined) break
			if (flag === false) continue

			// safe key
			const keyIsSafe = safeKeyRgx.test(flag);
			const safeKey = keyIsSafe ? flag : JSON.stringify(flag);
			const safeKeyAccessor = keyIsSafe ? "." + safeKey : `[${safeKey}]`;

			// bit value
			const bit = 1 << (7 - j)

			bitsSerialize[j] = `(val${safeKeyAccessor} ? ${bit} : 0)`
			deserializeStr.push(`${safeKey}: (${byteRef} & ${bit}) !== 0`)
		}

		serializeStr.push(`buf[${b}] = ${bitsSerialize.join(' | ')};`)
	}

	return {
		serialize: Function('alloc',
			'return function* bitFlagEnc(val) {'
				+ `const buf = alloc(${bytes});`
				+ serializeStr.join('')
				+ `yield buf`
			+ '}'
		)(Buffer.allocUnsafe),

		serializeSync: Function('alloc',
			'return function bitFlagEncSync(val, chunks) {'
				+ `const buf = alloc(${bytes});`
				+ serializeStr.join('')
				+ `chunks.push(buf)`
			+ '}'
		)(Buffer.allocUnsafe),
		
		deserialize: Function(
			'return function bitFlagDec(buf, offset, state) {' +
				`const ${byteDeclMap};` +
				`return { value: {${deserializeStr}}, offset: offset + ${bytes} }`
			+ '}'
		)()
	};
}
