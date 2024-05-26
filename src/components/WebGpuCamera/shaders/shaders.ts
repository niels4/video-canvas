// @ts-ignore
import passthrough from "./passthrough.wgsl"
// @ts-ignore
import greyscale from "./greyscale.wgsl"
// @ts-ignore
import sepia from "./sepia.wgsl"
// @ts-ignore
import edgeDetect from "./edgeDetect.wgsl"

export const shaders: { [key: string]: string } = {
  passthrough,
  greyscale,
  sepia,
  edgeDetect,
} as const

export type ShaderKey = keyof typeof shaders
