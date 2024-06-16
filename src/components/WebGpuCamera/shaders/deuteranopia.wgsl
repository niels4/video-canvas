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

fn applyContrast(color: vec3f, contrast: f32) -> vec3f {
    return (color - 0.5) * contrast + 0.5;
}

fn increaseSaturation(color: vec3f, amount: f32) -> vec3f {
    let gray = dot(color, vec3f(0.299, 0.587, 0.114)); // Luminance
    return mix(vec3f(gray), color, amount);
}

@fragment
fn fragmentMain(input: FragmentInput) -> @location(0) vec4f {
    var uv = input.clipSpaceCoord.xy / 2.0 + 0.5;
    uv.x = 1.0 - uv.x;
    uv.y = 1.0 - uv.y;
    let texColor = textureSampleBaseClampToEdge(myTexture, mySampler, uv);

    // Deuteranopia color adjustment
    var newRed = 0.625 * texColor.r + 0.375 * texColor.g;
    var newGreen = 0.7 * texColor.r + 0.3 * texColor.g;
    var newBlue = texColor.b;

    // Apply contrast enhancement
    let contrast = 1.5; // Higher contrast factor
    let enhancedColor = applyContrast(vec3f(newRed, newGreen, newBlue), contrast);

    // Increase saturation
    let saturatedColor = increaseSaturation(enhancedColor, 1.5); // High saturation amount

    return vec4f(saturatedColor, texColor.a);
}
