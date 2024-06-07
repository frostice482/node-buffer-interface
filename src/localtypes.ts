export type ReadonlyRecord<K extends PropertyKey, T> = { readonly [X in K]: T }
