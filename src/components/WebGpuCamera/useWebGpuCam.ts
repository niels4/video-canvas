import { RefObject, useEffect, useRef } from "react"

type WgslCode = string

type UseWebGpuParams = {
  canvasRef: RefObject<HTMLCanvasElement>
  videoRef: RefObject<HTMLVideoElement>
  wgsl: WgslCode
}

type CurrentFrameRef = {
  id: number | null
}

type InitWebGpuParams = UseWebGpuParams & {
  frameRef: RefObject<CurrentFrameRef>
}

async function initWebGPU({ canvasRef, videoRef, wgsl, frameRef }: InitWebGpuParams) {
  const canvas = canvasRef.current
  if (!canvas) {
    return null
  }
  const devicePixelRatio = window.devicePixelRatio || 1
  canvas.width = canvas.clientWidth * devicePixelRatio
  canvas.height = canvas.clientHeight * devicePixelRatio

  if (!navigator.gpu) {
    console.error("WebGPU not supported")
    throw new Error("WebGPU not supported on this browser!")
  }

  const context = canvas.getContext("webgpu") as GPUCanvasContext

  const adapter = await navigator.gpu.requestAdapter()
  if (!adapter) {
    console.error("No GPUAdapter")
    throw new Error("No appropriate GPUAdapter found.")
  }

  const device = await adapter.requestDevice()

  if (!device) {
    console.error("No device")
    throw new Error("Could not initialize webGPU canvas, no device")
  }

  const sampler = device.createSampler({
    magFilter: "linear", // Specifies the filtering method when the pixel being textured maps to an area greater than one texel.
    minFilter: "linear", // Specifies the filtering method when the pixel being textured maps to an area less than or equal to one texel.
    addressModeU: "clamp-to-edge", // Handling of texture coordinates outside the [0, 1] range.
    addressModeV: "clamp-to-edge",
  })

  const format = navigator.gpu.getPreferredCanvasFormat()
  context.configure({
    device,
    format,
  })

  // prettier-ignore
  const verticesArray = [
        // X, Y
        // bottom right triangle
        -1, -1, // left bottom
        1, -1, // right bottom
        1, 1, // right top

        // top left triangle
        -1, -1, // left bottom
        1, 1, // right top
        -1, 1, // left top
      ]
  const vertices = new Float32Array(verticesArray)

  const vertexBuffer = device.createBuffer({
    label: "One Square vertices",
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  })
  device.queue.writeBuffer(vertexBuffer, /*bufferOffset*/ 0, vertices)

  const attributeDescriptor: GPUVertexAttribute = {
    format: "float32x2",
    offset: 0,
    shaderLocation: 0,
  }

  const vertexBufferLayout: GPUVertexBufferLayout = {
    arrayStride: 8,
    attributes: [attributeDescriptor],
  }

  const timeBuffer = device.createBuffer({
    size: 4, // float32 size
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  })
  const timeValue = new Float32Array([0]) // Example conversion
  device.queue.writeBuffer(timeBuffer, 0, timeValue)

  const resolutionBuffer = device.createBuffer({
    size: 8, // float32 size * 2
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  })
  const resolutionValue = new Float32Array([window.innerWidth, window.innerHeight]) // Example conversion
  device.queue.writeBuffer(resolutionBuffer, 0, resolutionValue)

  const samplerEntry: GPUBindGroupLayoutEntry = {
    binding: 2,
    visibility: GPUShaderStage.FRAGMENT,
    sampler: {
      type: "filtering",
    },
  }

  const bindGroupLayout = device.createBindGroupLayout({
    label: "Bind Group Layout",
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT,
        buffer: {}, // grid uniform buffer ( no type key defaults to type: "uniform" )
      },
      {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        buffer: {}, // grid uniform buffer ( no type key defaults to type: "uniform" )
      },
      samplerEntry,
      {
        binding: 3,
        visibility: GPUShaderStage.FRAGMENT,
        externalTexture: {},
      },
    ],
  })

  const shaderModule = device.createShaderModule({
    label: "Simple shader module",
    code: wgsl,
  })

  const startTime = Date.now()

  const updateFrame = () => {
    frameRef.current!.id = requestAnimationFrame(updateFrame)
    if (!videoRef.current || videoRef.current.readyState < 2) {
      return
    }

    let externalTexture
    try {
      externalTexture = device.importExternalTexture({
        source: videoRef.current,
      })
    } catch (e) {
      return
    }

    const bindGroup = device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: timeBuffer,
          },
        },
        {
          binding: 1,
          resource: {
            buffer: resolutionBuffer,
          },
        },
        {
          binding: 2,
          resource: sampler,
        },
        {
          binding: 3,
          resource: device.importExternalTexture({
            source: videoRef.current,
          }),
        },
      ],
    })

    const time = (Date.now() - startTime) / 1000
    device.queue.writeBuffer(timeBuffer, 0, new Float32Array([time]))
    const resolutionValue = new Float32Array([window.innerWidth, window.innerHeight])
    device.queue.writeBuffer(resolutionBuffer, 0, resolutionValue)

    const pipelineLayout = device.createPipelineLayout({
      label: "Cell Pipeline Layout",
      bindGroupLayouts: [bindGroupLayout],
    })

    const pipeline = device.createRenderPipeline({
      label: "Simple shader pipeline",
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: "vertexMain",
        buffers: [vertexBufferLayout],
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fragmentMain",
        targets: [
          {
            format: format,
          },
        ],
      },
    })

    const encoder = device.createCommandEncoder()

    const colorAttachment: GPURenderPassColorAttachment = {
      view: context.getCurrentTexture().createView(),
      loadOp: "clear",
      storeOp: "store",
    }

    const pass = encoder.beginRenderPass({
      colorAttachments: [colorAttachment],
    })
    pass.setPipeline(pipeline)
    pass.setVertexBuffer(0, vertexBuffer)
    pass.setBindGroup(0, bindGroup)
    pass.draw(vertices.length / 2)
    pass.end()
    device.queue.submit([encoder.finish()])
  }

  updateFrame()

  const updateWgsl = (wgsl: WgslCode) => {
    console.log("updated wgslcode", wgsl)
  }

  return updateWgsl
}

async function initWebCam(videoRef: RefObject<HTMLVideoElement>) {
  if (!videoRef.current) return
  const video = videoRef.current

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    video.srcObject = stream
  } catch (error) {
    console.error("Failed to set up the webcam:", error)
  }
}

type CanvasInitializedRef = {
  initialized: Boolean
  updateWgsl: null | ((wgsl: string) => void)
}

export const useWebGpuCam = ({ canvasRef, videoRef, wgsl }: UseWebGpuParams) => {
  const frameRef = useRef<CurrentFrameRef>({ id: null })
  const canvasInitialized = useRef<CanvasInitializedRef>({ initialized: false, updateWgsl: null })

  useEffect(() => {
    if (!canvasInitialized.current.initialized) {
      canvasInitialized.current.initialized = true
      initWebGPU({ canvasRef, videoRef, wgsl, frameRef }).then((updateWgsl) => {
        canvasInitialized.current.updateWgsl = updateWgsl
      })
      initWebCam(videoRef)
    } else {
      if (canvasInitialized.current.updateWgsl) {
        canvasInitialized.current.updateWgsl(wgsl)
      }
    }

    return () => {
      if (frameRef.current.id) {
        // eslint-disable-next-line -- we want to always reference this object even if the value of frameRef.current changes
        cancelAnimationFrame(frameRef.current.id)
      }
    }
  }, [canvasRef, videoRef, wgsl])
}
