import BufInt from "../index.js";
import numberBufInt, { BufNumberTypes, NumberBufInt } from "./number.js";

function switchBufInt<T, Cases>(
	switchExpr: (value: T) => Cases,
	cases: Iterable<createSwitchBufint.SwitchCase<T, Cases>>,
	defaultCase: createSwitchBufint.DefaultCase<T> | null | undefined,
	enumType: BufNumberTypes | NumberBufInt
): BufInt<T> {
	const { encodeNum, readCall, bytes, min } = typeof enumType === 'string' ? numberBufInt[enumType] : enumType;

	// interface mapping
	const encMap = new Map<Cases, SwitchEncodeMapData<T>>();
	const decMap: Record<number, BufInt<T>> = Object.create(null);

	// cases
	let i = min;
	for (const c of cases) {
		const { case: caseExpr, bufint, enumValue = i++ } = c;
		encMap.set(caseExpr, { bufint: bufint, id: encodeNum(enumValue) });
		decMap[enumValue] = bufint;
	}

	let defCase: SwitchEncodeMapData<T>
	if (defaultCase) {
		const { bufint, enumValue } = defaultCase
		defCase = { bufint: bufint, id: encodeNum(enumValue ?? i) }
	}
	else {
		defCase = {
			bufint: switchIntErr,
			id: encodeNum(i)
		}
	}
	decMap[i] = defCase.bufint

	return {
		*serialize(value) {
			const { bufint, id } = encMap.get(switchExpr(value)) ?? defCase;

			yield id;
			yield* bufint.serialize(value);
		},
		serializeSync(value, chunks) {
			const { bufint, id } = encMap.get(switchExpr(value)) ?? defCase;

			chunks.push(id)
			bufint.serializeSync(value, chunks)
		},
		deserialize(buf, offset, state) {
			const id = readCall(buf, offset);
			offset += bytes;

			return decMap[id]!.deserialize(buf, offset, state);
		},
	};
}

declare namespace createSwitchBufint {
	interface SwitchCase<T, C> {
		readonly case: C;
		readonly bufint: BufInt<T>;
		readonly enumValue?: number;
	}
	
	interface DefaultCase<T> {
		readonly bufint: BufInt<T>;
		readonly enumValue?: number;
	}    
}

export default switchBufInt

const switchFailErr = SyntaxError("Switch case failed - no default case is provided")
const switchFnErr = () => { throw switchFailErr }
const switchIntErr: BufInt<never> = {
	serialize: switchFnErr,
	serializeSync: switchFnErr,
	deserialize: switchFnErr
}

interface SwitchEncodeMapData<T> {
	bufint: BufInt<T>
	id: Uint8Array;
}
