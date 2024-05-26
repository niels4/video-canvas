"use client"
import style from "./WebGpuCamera.module.css"
import { Dispatch, SetStateAction, useRef, useState } from "react"
import { useWebGpuCam } from "./useWebGpuCam"
import { ShaderKey, shaders } from "./shaders/shaders"

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
        <option value="edgeDetect">Edge Detect</option>
      </select>
    </div>
  )
}

const WebGpuCamera = () => {
  const [filter, setFilter] = useState<ShaderKey>("passthrough")
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useWebGpuCam({ videoRef, canvasRef, wgsl: shaders[filter] })

  const vidoeStyle = { width: "640px", height: "480px", margin: "20px" }

  return (
    <div className={style.web_gpu_camera_wrapper}>
      <FilterSelect {...{ filter, setFilter }} />
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
