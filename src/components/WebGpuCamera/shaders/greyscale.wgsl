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
