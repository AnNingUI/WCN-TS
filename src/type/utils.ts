type BuildTuple<
	N extends number,
	R extends unknown[] = []
> = R["length"] extends N ? R : BuildTuple<N, [...R, unknown]>;

export type Sub<A extends number, B extends number> = BuildTuple<A> extends [
	...BuildTuple<B>,
	...infer R
]
	? R["length"]
	: never;

export type Mul<
	A extends number,
	B extends number,
	R extends unknown[] = []
> = B extends 0 ? R["length"] : Mul<A, Sub<B, 1>, [...R, ...BuildTuple<A>]>;

export type Add<A extends number, B extends number> = [
	...BuildTuple<A>,
	...BuildTuple<B>
]["length"];
