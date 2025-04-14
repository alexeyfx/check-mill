export type OneOrMany<T> = T | T[];

declare const brand: unique symbol;
export type Id<T> = number & { readonly [brand]: T };
