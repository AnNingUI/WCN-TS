/**
 * @description
 * ```
 * VSize is the value pointed to by the pointer, and CName is the name of the c type pointed to by the pointer
 * ```
 */
export type Ptr<
	VSize extends number,
	CName extends string = "?",
	OtherMeta extends any[] = []
> = number | (number & ["$size:", VSize, "$name:", CName, ...OtherMeta]);

export type F32Size = 4;

export type ImageDataPtr = Ptr<20, "WCN_ImageData">;
