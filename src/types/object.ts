import BufInt from "../index.js";
import { ReadonlyRecord } from "../localtypes.js";

const safeKeyRgx = /^(?!\d)[\w$]+$/i;

function objectBufInt<T extends ReadonlyRecord<string, BufInt<unknown>>, X extends objectBufInt.Extract<T>>(properties: T): BufInt<
	{ [K in keyof T]: X[K]['T'] },
	{ [K in keyof T]: X[K]['E'] }
> {
	/**
	 * inline yield* expressions
	 * ```
	 * yield* $bufint.serialize($ref);
	 * // ...
	 * ```
	 */
	const serializeStr: string[] = [];
	/**
	 * inline sync expressions
	 * ```
	 * $bufint.serializeSync($ref, chunks);
	 * // ...
	 * ```
	 */
	const serializeSyncStr: string[] = [];
	/**
	 * inline code for decoding
	 * ```
	 * r = $bufint.serialize(view, offset, buf, state);
	 * const $ref = r.value;
	 * offset = r.offset;
	 * // ...
	 * ```
	 */
	const deserializeStr: string[] = ["let r;"];
	/**
	 * key to ref mapping
	 * ```
	 * ({$prop: $ref, ...})
	 * ```
	 */
	const propToRefMap: string[] = [];
	/**
	 * prop to bufint mapping
	 * ```
	 * ({$prop: $bufint, ...})
	 * ```
	 */
	const propToBufintMap: string[] = [];

	let i = 0;
	for (const key in properties) {
		// safe key
		const keyIsSafe = safeKeyRgx.test(key);
		const safeKey = keyIsSafe ? key : JSON.stringify(key);
		const safeKeyAccessor = safeKeyRgx.test(key) ? "." + safeKey : `[${safeKey}]`;

		const ref = "$" + (i++).toString(36);

		serializeStr.push(`yield* ${ref}.serialize(val${safeKeyAccessor});`);
		serializeSyncStr.push(`${ref}.serializeSync(val${safeKeyAccessor}, chunks);`);
		
		deserializeStr.push(
			`r = ${ref}.deserialize(buf, offset, state);`,
			`const ${ref}v = r.value;`,
			`offset = r.offset;`
		);

		propToRefMap.push(`${safeKey}: ${ref}v`);
		propToBufintMap.push(`${safeKey}: ${ref}`);
	}

	const refMapStr = `{${propToBufintMap}}`;

	return {
		serialize: Function(refMapStr, 'return function* objEnc(val) {' + serializeStr.join("") + '}')(properties),
		serializeSync: Function(refMapStr, 'return function objEncSync(val, chunks) {' + serializeSyncStr.join("") + '}')(properties),

		deserialize: Function(refMapStr,
			'return function objDec(buf, offset, state) {'
				+ deserializeStr.join("")
				+ `return { value: {${propToRefMap}}, offset }`
			+ '}'
		)(properties)
	};
}

namespace objectBufInt {
	export type Extract<T> = { [K in keyof T]: T[K] extends BufInt<infer Des, infer Ser> ? { T: Des, E: Ser } : never };
}

export default objectBufInt
