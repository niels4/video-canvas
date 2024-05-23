"use client"
import { useRef, useEffect } from "react"

const initialWgslCode = `
@vertex
fn vertexMain(@location(0) pos: vec2f) -> @builtin(position) vec4f {
return vec4f(pos, 0, 1);
}

@fragment
fn fragmentMain() -> @location(0) vec4f {
return vec4f(0.2, 0.5, 0.8, 1);
}
`

const WebGPUPage = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canvasInitialized = useRef({ initialized: false })

  useEffect(() => {
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

      const vertexBufferLayout = {
        arrayStride: 8,
        attributes: [
          {
            format: "float32x2",
            offset: 0,
            shaderLocation: 0,
          },
        ],
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
        ],
      })

      const bindGroup = device.createBindGroup({
        label: "Bind Group",
        layout: bindGroupLayout,
        entries: [
          {
            binding: 0,
            resource: { buffer: timeBuffer },
          },
          {
            binding: 1,
            resource: { buffer: resolutionBuffer },
          },
        ],
      })

      const shaderModule = device.createShaderModule({
        label: "Simple shader module",
        code: initialWgslCode,
      })

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
  }, [])

  return (
    <div>
      <h1>WebGPU with Webcam and Greyscale Filter</h1>
      <video ref={videoRef} autoPlay playsInline muted></video>
      <canvas ref={canvasRef}></canvas>
    </div>
  )
}

export default WebGPUPage
