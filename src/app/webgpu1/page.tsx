"use client"
import { useRef, useEffect } from "react"

type CanvasState = {
  device: GPUDevice
  canvas: HTMLCanvasElement
  context: GPUCanvasContext
  format: GPUTextureFormat
}

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
