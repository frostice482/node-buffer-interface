A NodeJS library to deal with binary data, serialize from / deserialize to JS values, e.g. String, Number, BigInt, Boolean, Object, Array, etc.

## Usage
```ts
// ESM
import BufInt from "node-buffer-interface";

// CJS
const BufInt = require("node-buffer-interface");
```

## Methods

`BufInt.serialize(value: unknown)`

Serializes value into iterable chunks of Buffer

`BufInt.serializeSync(value: unknown)`

Serializes value into array of chunks of Buffer

`BufInt.deserialize(buffer: Buffer | Uint8Array, offset: number)`

Deserializes Buffer to value, returns deserialized value and new offset

## Types
Some built-in types for BufInt are specified below.

### Const
```ts
BufInt.Const(value: any)
```

Just a placeholder.

### String
```ts
BufInt.String(sizeType: UINT, encoding: STRING)
```

Used to handle string interface.
Adds extra few bytes at the beginning to store string length info.

Some known encodings can be used directly, e.g. `BufInt.String.utf8_32be` for UTF-8 encoding with `uint32` size.

### Buffer
```ts
BufInt.Buffer(sizeType: UINT)
```

Used to handle buffer interface.
Adds extra few bytes at the beginning to store buffer length info.

Buffer with common sizes can be used directly, e.g. `BufInt.Buffer.uint8` for buffer with `uint8` size.

### Number
```ts
BufInt.Number[NUMTYPE]
```

### BigInt
```ts
BufInt.BigInt[TYPE]
```

### Array
```ts
BufInt.Array(bufint: BufInt, sizeType: UINT)
```

Used to create array interface.
Calls bufint method for every element in the array during serialize / deserialize.
Adds extra few bytes at the beginning to store array length info.

### Object
```ts
BufInt.Object(object: Record<string, BufInt>)
```

Used to create object interface. Objects should be ordered.
Calls bufint method for every property during serialize / deserialize.

### Enum
```ts
BufInt.Enum(values: Iterable<{ value: unknown, enumValue?: number }>, valueType: NUMTYPE)
```

Used to create enum interface. Auto-converts enumerables, like {`ONE`, `TWO`, `THREE`} to numbers {`0`, `1`, `2`}.

`enumValue` specifies number values to use in the buffer to the value.
Defaults increments from minimum value. `valueType` specifies the number type to use in the buffer.

`BufInt.Enum.fromArray` can be used to use arrays as values instead, and the `enumValue` will be incremented from minimum.

### Optional
```ts
BufInt.Optional(bufint: BufInt)
```

Used to create optional interface.
Adds one extra byte to store value existence. `0` if `undefined`, `1` if exists.

`BufInt.Optional.Nullable` can be used to adds support for `null` values. Its value as number is `2`.

### BitFlags
```ts
BufInt.BitFlags(flags: ArrayLike<string | false>)
```

Used to create interface of an object of booleans. Uses one bit to store a boolean rather than a byte.
A flag with `false` skips one bit. Can use up to 32 flags simultaneously.

For example, `BitFlags(['a', 'b', false, 'c'])` will get property `a`, `b`, and `c` from an object when serialize and uses 1 byte (3 bits) only rather than 3.
If an object is `{a: false, b: true, c: true}`, then the byte will be `0b010100000`.

### BitField
```ts
BufInt.BitField(
    fields: ArrayLike<{
        key: string | false,
        bits: number
    }>, 
    bytes?: number
)
```

Used to create interface of an object of numbers.
Each field / key can specify number of bits to use. Can use up to 32 bits simultaneously.

Consider following example:
```ts
BitField([
    { key: 'a', bits: 2 },
    { key: 'b', bits: 4 },
    { key: 'c', bits: 3 },
    { key: 'd', bits: 1 },
])
```
The byte representation will be `AABBBBCC` `CD------`

This interface will take property `a`, `b`, `c`, and `d` from an object when serialize and uses 2 bytes (10 bits) only rather than 4.
If an object is `{a: 2, b: 11, c: 5, d: 1}`, then the byte will be `10101110` `11000000`.

### Switch
```ts
BufInt.Switch(
    switchExpr: (value: unknown) => Cases
    cases: Iterable<{
        case: unknown;
        bufint: BufInt;
        enumValue?: number;
    }>,
    defaultCase: {
        bufint: BufInt;
        enumValue?: number;
    } | null | undefined,
    enumType: NUMTYPE
)
```

Used to create interface of switch case. Adds first few bytes to determine which case to use.

This allows multiple type of values to be used in a single bufint.
The "switch" function expression determines which bufint to use depending on the case.

If any other value type is passed, it will check for default bufint provided.
If the default bufint is not provided (`null` or `undefined`), it throws an error.

Same as enum, `enumValue` specifies number values to use in the buffer to the value.
Defaults increments from minimum value. `enumType` specifies the number type to use in the buffer.

Consider following example:
```ts
BufInt.Switch(
    v => typeof v,
    [
        { case: 'string', bufint: BufInt.String.utf8_32be },
        { case: 'number', bufint: BufInt.Number.float64le },
        { case: 'boolean', bufint: BufInt.Boolean },
        { case: 'bigint', bufint: BufInt.Bigint.biguint64le },
    ],
    null,
    'uint8'
)
```

This allows `string`, `number`, `boolean`, or `bigint` value type to be used in a single bufint.
The function `v => typeof v` acts as a "switch" function to determine which bufint to use.
