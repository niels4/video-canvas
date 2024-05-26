"use client"
import style from "./WebGpuCamera.module.css"
import { useRef } from "react"
import { useWebGpuCam } from "./useWebGpuCam"
import { shaders } from "./shaders/shaders"

const WebGpuCamera = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useWebGpuCam({ videoRef, canvasRef, wgsl: shaders.edgeDetect })

  const vidoeStyle = { width: "640px", height: "480px", margin: "20px" }

  return (
    <div className={style.web_gpu_camera_wrapper}>
      <video
        style={{ visibility: "hidden", position: "absolute" }}
        ref={videoRef}
        autoPlay
        playsInline
        muted
      ></video>
      <canvas style={vidoeStyle} ref={canvasRef}></canvas>
    </div>
  )
}

export default WebGpuCamera
