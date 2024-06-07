import array_t from "./types/array.js";
import bigint_t from "./types/bigint.js";
import bitfield_t from "./types/bitfield.js";
import bitflags_t from "./types/bitflags.js";
import boolean_t from "./types/bool.js";
import buffer_t from "./types/buffer.js";
import const_t from "./types/const.js";
import enum_t from "./types/enum.js";
import number_t from "./types/number.js";
import object_t from "./types/object.js";
import optional_t from "./types/optional.js";
import string_t from "./types/string.js";
import switch_t from "./types/switch.js";

namespace BufInt {
	export const Array = array_t;
	export const Boolean = boolean_t;
	export const Buffer = buffer_t;
	export const Enum = enum_t;
	export const Number = number_t;
	export const Object = object_t;
	export const Optional = optional_t;
	export const String = string_t;
	export const Switch = switch_t;
	export const BitFlags = bitflags_t;
	export const BitField = bitfield_t;
	export const Const = const_t;
	export const Bigint = bigint_t;

	/**
	 * Creates a wrapper bufint
	 * @param bufint Initial bufint
	 * @param preEncode Function to execute before a value is encoded.
	 *  This is to alter value that passes through the encoder
	 * @param postDecode Function to execute after a value is decoded.
	 *  This is to alter value that returned by the decoder.
	 * @returns Wrapped bufint
	 */
	export function wrap<Des, Ser, WDes, WSer>(
		bufint: BufInt<Des, Ser>,
		preEncode: (value: WSer) => Ser,
		postDecode: (value: Des, buf: Buffer, offset: number, newOffset: number) => WDes
	): BufInt<WDes, WSer> {
		return {
			serialize(value) {
				return bufint.serialize(preEncode(value));
			},
			serializeSync(value, chunks) {
				bufint.serializeSync(preEncode(value), chunks)
			},
			deserialize(buf, offset, state) {
				const { value, offset: newOffset } = bufint.deserialize(buf, offset, state);
				const valueMap = postDecode(value, buf, offset, newOffset);
				return { value: valueMap, offset: newOffset };
			},
		};
	}
}

interface BufInt<Des, Ser = Des> {
	serialize(value: Ser): Iterable<Buffer | Uint8Array>;
	serializeSync(value: Ser, chunks: (Buffer | Uint8Array)[]): void;
	deserialize(buf: Buffer, offset: number, state?: unknown): { value: Des; offset: number };
}

export default BufInt;
