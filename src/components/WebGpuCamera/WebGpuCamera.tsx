"use client"
import style from "./WebGpuCamera.module.css"
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react"
import { useWebGpuCam } from "./useWebGpuCam"
import { ShaderKey, shaders } from "./shaders/shaders"

const ErrorMessage = () => {
  return (
    <div>
      <h2 className={style.error_header}>Your browser does not support WebGPU.</h2>
      <p>
        Visit{" "}
        <a target="_blank" href="https://caniuse.com/webgpu">
          caniuse.com/webgpu
        </a>{" "}
        to see a list of currently supported web browsers.
      </p>
    </div>
  )
}

type FilterSelectProps = {
  filter: ShaderKey
  setFilter: Dispatch<SetStateAction<ShaderKey>>
}

const FilterSelect = ({ filter, setFilter }: FilterSelectProps) => {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const shaderKey = event.target.value as ShaderKey
    setFilter(shaderKey)
  }
  return (
    <div className={style.filter_select_wrapper}>
      <label htmlFor="filter-select">Current Filter: </label>
      <select id="filter-select" value={filter} onChange={handleChange}>
        <option value="passthrough">Passthrough</option>
        <option value="greyscale">Greyscale</option>
        <option value="sepia">Sepia</option>
        <option value="invert">Invert Colors</option>
        <option value="gaussianBlur">Gaussian Blur</option>
        <option value="edgeDetect">Edge Detect</option>
      </select>
    </div>
  )
}

const WebGpuCamera = () => {
  const [filter, setFilter] = useState<ShaderKey>("passthrough")
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [webGpuSupported, setWebGpuSupported] = useState(true)
  useEffect(() => {
    setWebGpuSupported(navigator.gpu != null)
  }, [])

  useWebGpuCam({ videoRef, canvasRef, wgsl: shaders[filter] })

  const canvasStyle = { width: "640px", height: "480px", margin: "20px" }

  return (
    <div className={style.web_gpu_camera_wrapper} suppressHydrationWarning={true}>
      <FilterSelect {...{ filter, setFilter }} />
      <video
        style={{ visibility: "hidden", position: "absolute" }}
        ref={videoRef}
        autoPlay
        playsInline
        muted
      ></video>
      <canvas style={canvasStyle} ref={canvasRef}></canvas>
      {!webGpuSupported ? <ErrorMessage /> : null}
      <p className={style.privacy_notice}>
        None of the data from your webcam is ever transmitted or saved. The video processing takes place
        entirely in your browser. The webcamera is used as a video source to demonstrate that the video
        processing is happening in real-time.
      </p>
    </div>
  )
}

export default WebGpuCamera
