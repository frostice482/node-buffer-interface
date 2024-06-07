import BufInt from "../index.js";

const valueUndefined = new Uint8Array([0]),
	valueExist = new Uint8Array([1]),
	valueNull = new Uint8Array([2]);

function optionalBufInt<Des, Ser>(bufint: BufInt<Des, Ser>): BufInt<Des | undefined, Ser | undefined> {
	return {
		*serialize(value) {
			if (value === undefined) return yield valueUndefined;

			yield valueExist;
			yield* bufint.serialize(value);
		},
		serializeSync(value, chunks) {
			if (value === undefined) return chunks.push(valueUndefined);

			chunks.push(valueExist);
			bufint.serializeSync(value, chunks);
		},
		deserialize(buf, offset, state) {
			const exists = buf[offset++] === 1;
			return exists ? bufint.deserialize(buf, offset, state) : { value: undefined, offset };
		},
	};
}

namespace optionalBufInt {
	export function Nullable<Des, Ser>(bufint: BufInt<Des, Ser>): BufInt<Des | null | undefined, Ser | null | undefined> {
		return {
			*serialize(value) {
				if (value === undefined) return yield valueUndefined;
				if (value === null) return yield valueNull;

				yield valueExist;
				yield* bufint.serialize(value);
			},
			serializeSync(value, chunks) {
				if (value === undefined) return chunks.push(valueUndefined);
				if (value === null) return chunks.push(valueNull);

				chunks.push(valueExist);
				bufint.serializeSync(value, chunks);
			},
			deserialize(buf, offset, state) {
				const exists = buf[offset++];
				return exists === 0 ? { value: undefined, offset }
					: exists === 2 ? { value: null, offset }
					: bufint.deserialize(buf, offset, state);
			},
		};
	}
}

export default optionalBufInt
