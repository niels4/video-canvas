# WebGPU Video Processing Tool

## Overview

This project was created to be a short tech demo to explore real-time video processing in the browser. Normally I wouldn't use Next.js for a client side application with such a small scope, but I wanted to include some code samples that demonstrate my
ability to work with Next.js and Typescript. The tool captures video from the user's webcam and applies various shader effects in real-time. The available effects include passthrough, greyscale, sepia, and edge detection.

## Published Demo

You can view a running demo published at [https://niels4.dev/video-canvas](https://niels4.dev/video-canvas)

None of the data from your webcam is ever transmitted or saved. The video processing takes place entirely in your browser. The webcamera is used as a video source to demonstrate that the video processing is happening in real-time.

## Features

- Real-time video capture from the user's webcam.
- WebGPU-based shader processing for video effects.
- Dynamic shader effect selection through a React-based UI.
- Filters include edge detection, guassian blur, and color correction to add contrast for users with different forms of colorblindness.

## Technologies Used

- **TypeScript**: For type-safe JavaScript development.
- **React**: For building the user interface.
- **WebGPU**: For high-performance graphics and compute operations.
- **Next.js**: For server-side rendering and static site generation.

## Getting Started

### Prerequisites

- Node.js

### Installation

1. Clone the repository:

    ```sh
        git clone https://github.com/niels4/video-canvas
        cd video-canvas
    ```

2. Install the dependencies:

    ```sh
        npm install
    ```

### Running the Project

1. Start the development server:

    ```sh
        npm run dev
    ```

2. Open your browser and navigate to `http://localhost:3000`.

### Project Structure

This is a simple project that contains only one component.

The `WebGPUCamera.tsx` file sets up the shader select dropdown, the webcam video element, and the webGPU canvas element. The `useWebGpuCam` hook
wires everything up by passing the webcam output to the webGPU context and uses the specified shader to modify the output shown on screen.

The shaders are defined in WGSL files in the `components/WebGPUCamera/shaders/` directory. They are split out
into their own files with a .wgsl extension to make them easier to work with in a text editor. In `shaders.ts`, each file is read in as a string
and added to a `shaders` object. A `ShaderKey` type is exported to make working with this object more type safe.

### Example WGSL file (greyscale)

```wgsl
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

        // Calculate the luminance from the RGB color components
        let luminance = 0.299 * texColor.r + 0.587 * texColor.g + 0.114 * texColor.b;

        // Create a greyscale color by setting all color components to the luminance value
        return vec4f(luminance, luminance, luminance, 1.0);
}
```

### Adding New Shader Effects

To add a new shader effect:

1. Create a new WGSL file in the `shaders/` directory.
2. Import the new shader in your TypeScript files and add it to the `shaders` object in the `shaders.ts` file.
3. Add an option for this shader to the select dropdown in `WebGPUCamera.tsx`

### License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
