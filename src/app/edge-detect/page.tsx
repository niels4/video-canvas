"use client"
import { useRef, useEffect } from "react"
import Link from "next/link"

const initialWgslCode = `
struct VertexInput {
    @location(0) pos: vec2f,
}

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(1) clipSpaceCoord: vec2f,
}

struct FragmentInput {
    @location(1) clipSpaceCoord: vec2f,
}

@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    output.position = vec4f(input.pos, 0.0, 1.0);
    output.clipSpaceCoord = input.pos;
    return output;
}

@group(0) @binding(0) var<uniform> time: f32;
@group(0) @binding(1) var<uniform> resolution: vec2f;
@group(0) @binding(2) var mySampler: sampler;
@group(0) @binding(3) var myTexture: texture_external;

@fragment
fn fragmentMain(input: FragmentInput) -> @location(0) vec4f {
    var uv = input.clipSpaceCoord.xy / 2.0 + 0.5; // Normalized UV coordinates
    uv.x = 1.0 - uv.x;
    uv.y = 1.0 - uv.y;

    let texColor = textureSampleBaseClampToEdge(myTexture, mySampler, uv);

    // Compute Sobel filter
    let offset = vec2f(1.0) / resolution;

    let left = textureSampleBaseClampToEdge(myTexture, mySampler, uv - vec2f(offset.x, 0.0)).r;
    let right = textureSampleBaseClampToEdge(myTexture, mySampler, uv + vec2f(offset.x, 0.0)).r;
    let top = textureSampleBaseClampToEdge(myTexture, mySampler, uv - vec2f(0.0, offset.y)).r;
    let bottom = textureSampleBaseClampToEdge(myTexture, mySampler, uv + vec2f(0.0, offset.y)).r;

    let edgeH = left - right;
    let edgeV = top - bottom;

    let edgeMagnitude = sqrt((edgeH * edgeH) + (edgeV * edgeV));

    return vec4f(vec3f(edgeMagnitude), 1.0);
}
`

const WebGPUPage = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canvasInitialized = useRef({ initialized: false })

  useEffect(() => {
    let currRequestFrame: number
    if (canvasInitialized.current.initialized) {
      return
    }
    canvasInitialized.current.initialized = true
    async function initializeWebGPU() {
      const canvas = canvasRef.current
      if (!canvas) {
        return
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
        code: initialWgslCode,
      })

      const startTime = Date.now()
      const updateFrame = () => {
        currRequestFrame = requestAnimationFrame(updateFrame)
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

      return { device, canvas, context, format }
    }

    async function setupWebcam() {
      if (!videoRef.current) return
      const video = videoRef.current

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        video.srcObject = stream
      } catch (error) {
        console.error("Failed to set up the webcam:", error)
      }
    }

    initializeWebGPU()
    setupWebcam()
    return () => {
      if (currRequestFrame) {
        cancelAnimationFrame(currRequestFrame)
      }
    }
  }, [])

  const vidoeStyle = { width: "640px", height: "480px", margin: "20px" }

  return (
    <div>
      <Link href="/">Back to home</Link>
      <h1>WebGPU with Webcam and Greyscale Filter</h1>
      <video style={vidoeStyle} ref={videoRef} autoPlay playsInline muted></video>
      <canvas style={vidoeStyle} ref={canvasRef}></canvas>
    </div>
  )
}

export default WebGPUPage
