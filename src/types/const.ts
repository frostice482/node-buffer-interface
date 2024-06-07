import BufInt from "../index.js";

const emptyIterator = (function* () {})();
emptyIterator.next();

function constBufInt<T>(value: T): BufInt<T> {
	return {
		serialize: () => emptyIterator,
		serializeSync() {},
		deserialize: (_, offset) => ({ value, offset }),
	};
}

namespace constBufInt {
	export const null_c = constBufInt(null);
	export const undefined_c = constBufInt(null);
}

export default constBufInt
