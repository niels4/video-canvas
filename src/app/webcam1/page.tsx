"use client"
import { useEffect, useRef } from "react"
import Link from "next/link"

export default function Webcam1() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    let currentVideoRef: HTMLVideoElement
    async function getVideo() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true })

        if (videoRef.current) {
          currentVideoRef = videoRef.current
          videoRef.current.srcObject = mediaStream
          videoRef.current.play()
        }
      } catch (error) {
        console.error("Error accessing the webcam:", error)
      }
    }

    getVideo()

    return () => {
      if (currentVideoRef && currentVideoRef.srcObject) {
        const tracks = (currentVideoRef.srcObject as MediaStream).getTracks()
        tracks.forEach((track) => track.stop())
      }
    }
  }, [])

  return (
    <main>
      <h1>Webcam Feed</h1>
      <Link href="/">Back to home</Link>
      <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%" }} />
    </main>
  )
}
