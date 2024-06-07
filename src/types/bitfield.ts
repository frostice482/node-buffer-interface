import BufInt from "../index.js";
import { ReadonlyRecord } from "../localtypes.js";

const safeKeyRgx = /^(?!\d)[\w$]+$/i;

const { allocUnsafe, prototype: {readUIntBE, writeUIntBE} } = Buffer
const ruintbecall = readUIntBE.call.bind(readUIntBE) as (thisArg: Buffer, offset: number, byteLength: number) => number
const wuintbecall = writeUIntBE.call.bind(writeUIntBE) as (thisArg: Buffer, value: number, offset: number, byteLength: number) => number

function bitfieldBufInt<T extends string>(fields: ArrayLike<bitfieldBufInt.Field<T>>, bytes?: number): BufInt<Record<T, number>, ReadonlyRecord<T, number>> {
    // auto determine byte size
    if (!bytes) {
        let bits = 0
        for (let i = 0; i < fields.length; i++) bits += fields[i]!.bits
        bytes = Math.ceil(bits / 8)
    }

    const serializeStr: string[] = []
    const deserializeStr: string[] = []

    if (bytes > 4) throw RangeError('BitField type can have up to 4 bytes max')

    let shift = bytes * 8
    for (let i = 0; i < fields.length; i++) {
        const { key, bits } = fields[i]!
        shift -= bits
        if (!key) continue
    
        // safe key
        const keyIsSafe = safeKeyRgx.test(key);
        const safeKey = keyIsSafe ? key : JSON.stringify(key);
        const safeKeyAccessor = keyIsSafe ? "." + safeKey : `[${safeKey}]`;

        const bitAnd = (1 << bits) - 1
        serializeStr.push(`(val${safeKeyAccessor} & ${bitAnd}) << ${shift}`)
        deserializeStr.push(`${safeKey}: byte >> ${shift} & ${bitAnd}`)
    }

	const repetitive = (text: string, isGen = false) => Function(
		'alloc, write',
		`return function${isGen ? '*' : ''} bitfieldEnc(val, chk) {`
            + `const buf = alloc(${bytes});`
            + `write(buf, ${serializeStr.join(' | ')}, 0, ${bytes});`
            + text
        + '}'
	)(allocUnsafe, wuintbecall)

    return {
        serialize: repetitive('yield buf', true),
        serializeSync: repetitive('chk.push(buf)'),

        deserialize: Function('read',
            'return function(buf, offset) {'
                + `const byte = read(buf, 0, ${bytes});`
                + `return { value: {${deserializeStr}}, offset: offset + ${bytes} }`
            + '}'
        )(ruintbecall)
    }
}

declare namespace bitfieldBufInt {
    interface Field<T> {
        key: T | false
        bits: number
    }
}

export default bitfieldBufInt
