import Link from "next/link"

export default function Home() {
  return (
    <main>
      <h1>Video Canvas</h1>
      <Link href="webcam1">webcam 1</Link>
      <br />
      <Link href="webgpu1">webGPU 1</Link>
      <br />
      <Link href="webgpu2">webGPU 2</Link>
      <br />
      <Link href="greyscale">greyscale</Link>
      <br />
      <Link href="edge-detect">Edge Detection</Link>
    </main>
  )
}
