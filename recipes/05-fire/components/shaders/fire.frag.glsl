precision highp float;
varying vec2 vUv;

uniform sampler2D noiseTexture;

void main() {
    vec4 noiseColor = texture2D(noiseTexture, vUv);
    float noiseValue = noiseColor.r * (1.0 - vUv.y)   + 0.25;
    float grey = smoothstep(0.5 - 0.03, 0.5 + 0.03, noiseValue);
    if(grey <= 0.01 ) discard;
    vec3 color = vec3(1.0, 0.5, 0.0);
    color.g = color.g * ( (1.0 + (1.0 - vUv.y)) * (noiseValue));
    // color.b = color.b * (1.0 + (1.0 - vUv.y) * ( grey));
    // vec3 color = mix(vec3(1.0, 1.0, 1.0), vec3(1.0, 1.0, 0.0), grey);
    
    gl_FragColor = vec4(color, grey  );
  
}