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

    let offset = vec2f(1.0) / resolution;
    let weights = array<f32, 9>(0.204164, 0.304005, 0.093913, 0.023418, 0.001298, 0.001298, 0.023418, 0.093913, 0.304005);
    let weightSum = weights[0] + 2.0 * (weights[1] + weights[2] + weights[3] + weights[4] + weights[5] + weights[6] + weights[7] + weights[8]);

    var blurColor = texColor * weights[0];
    for (var i = 1u; i < 9u; i = i + 1u) {
        blurColor += textureSampleBaseClampToEdge(myTexture, mySampler, uv + vec2f(offset.x * f32(i), 0.0)) * weights[i];
        blurColor += textureSampleBaseClampToEdge(myTexture, mySampler, uv - vec2f(offset.x * f32(i), 0.0)) * weights[i];
        blurColor += textureSampleBaseClampToEdge(myTexture, mySampler, uv + vec2f(0.0, offset.y * f32(i))) * weights[i];
        blurColor += textureSampleBaseClampToEdge(myTexture, mySampler, uv - vec2f(0.0, offset.y * f32(i))) * weights[i];
    }

    blurColor = blurColor / weightSum; // Normalize the result
    blurColor = blurColor * 0.9; // Slightly darken the result

    return blurColor;
}
