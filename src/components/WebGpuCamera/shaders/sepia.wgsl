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

    let sepiaColor = vec3f(
        (texColor.r * 0.393) + (texColor.g * 0.769) + (texColor.b * 0.189),
        (texColor.r * 0.349) + (texColor.g * 0.686) + (texColor.b * 0.168),
        (texColor.r * 0.272) + (texColor.g * 0.534) + (texColor.b * 0.131)
    );

    return vec4f(sepiaColor, 1.0);
}
