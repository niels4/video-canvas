# WebGPU Video Processing Tool

## Overview

This project was created to be a short tech demo to explore real-time video processing in the browser. Normally I wouldn't use Next.js for a client side application with such a small scope, but I wanted to include some code samples that demonstrate my
ability to work with Next.js and Typescript. The tool captures video from the user's webcam and applies various shader effects in real-time. The available effects include passthrough, greyscale, sepia, and edge detection.

## Published Example

You can view a running example published at [https://niels4.dev/video-canvas](https://niels4.dev/video-canvas)

None of the data from your webcam is ever transmitted or saved. The video processing takes place entirely in your browser. The webcamera is used as a video source to demonstrate that the video processing is happening in real-time.

## Features

- Real-time video capture from the user's webcam.
- WebGPU-based shader processing for video effects.
- Dynamic shader effect selection through a React-based UI.
- Four shader effects: passthrough, greyscale, sepia, and edge detection.

## Technologies Used

- **TypeScript**: For type-safe JavaScript development.
- **React**: For building the user interface.
- **WebGPU**: For high-performance graphics and compute operations.
- **Next.js**: For server-side rendering and static site generation.

## Getting Started

### Prerequisites

- Node.js (>= 14.x)
- npm (>= 6.x)

### Installation

1. Clone the repository:

    ```sh
        git clone https://github.com/yourusername/webgpu-video-processing-tool.git
        cd webgpu-video-processing-tool
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

- `pages/`: Contains the Next.js pages.
  - `index.tsx`: The main page component with the video processing tool.
  - `components/`: Contains the React components.
    - `FilterSelect.tsx`: A component for selecting the shader effect.
    - `shaders/`: Contains the WGSL shader files.
      - `passthrough.wgsl`
        - `greyscale.wgsl`
          - `sepia.wgsl`
            - `edgeDetect.wgsl`
            - `next.config.js`: Configuration file for Next.js and Webpack.
            - `public/`: Static assets.
            - `styles/`: Global styles.

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
2. Define your shader code in the new file.
3. Import the new shader in your TypeScript files and add it to the `shaders` object in the `shaders.ts` file.

### License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
