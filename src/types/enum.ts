import BufInt from "../index.js";
import numberBufInt, { BufIntMapDefs_Uint, BufNumberTypes, NumberBufInt } from "./number.js";

function enumBufInt<T>(enums: Iterable<enumBufInt.EnumPair<T>>, valueType: BufNumberTypes | NumberBufInt): BufInt<T> {
	// enum map
	const encMap = new Map<T, Uint8Array>();
	const decMap: Record<number, T> = Object.create(null);

	const { bytes, encodeNum, readCall, min } = typeof valueType === 'string' ? numberBufInt[valueType] : valueType;

	// mapping
	let valInc = min;
	for (const { value, enumValue = valInc++ } of enums) {
		encMap.set(value, encodeNum(enumValue));
		decMap[enumValue] = value;
	}

	return {
		*serialize(value) {
			yield encMap.get(value)!;
		},
		serializeSync(value, chunks) {
			chunks.push(encMap.get(value)!)
		},
		deserialize(buf, offset) {
			const i = readCall(buf, offset);
			return { value: decMap[i]!, offset: offset + bytes };
		},
	};
}

namespace enumBufInt {
	export function fromArray<T>(enums: ArrayLike<T> | Iterable<T>, valueShouldLittle = false) {
		const enumsArr = Array.from(enums, (v, i) => ({ value: v, enumValue: i }))
		const sizeType = BufIntMapDefs_Uint.find(v => valueShouldLittle === (v.little ?? valueShouldLittle) && v.max >= enumsArr.length)?.key

		if (!sizeType) throw ReferenceError('Failed to determine size type to use')
		
		return enumBufInt(enumsArr, sizeType)
	}
		
	export interface EnumPair<T> {
		readonly value: T;
		readonly enumValue?: number;
	}
}

export default enumBufInt
