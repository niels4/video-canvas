// @ts-ignore
import passthrough from "./passthrough.wgsl"
// @ts-ignore
import greyscale from "./greyscale.wgsl"
// @ts-ignore
import sepia from "./sepia.wgsl"
// @ts-ignore
import edgeDetect from "./edgeDetect.wgsl"
// @ts-ignore
import invert from "./invert.wgsl"
// @ts-ignore
import gaussianBlur from "./gaussianBlur.wgsl"
// @ts-ignore
import protanopia from "./protanopia.wgsl"
// @ts-ignore
import deuteranopia from "./deuteranopia.wgsl"
// @ts-ignore
import tritanopia from "./tritanopia.wgsl"

export const shaders: { [key: string]: string } = {
  passthrough,
  greyscale,
  sepia,
  invert,
  gaussianBlur,
  edgeDetect,
  protanopia,
  deuteranopia,
  tritanopia,
} as const

export type ShaderKey = keyof typeof shaders
