// WebGL2 renderer: Blazor owns particle generation, geometry, and UI.
// JavaScript is only the browser graphics bridge and animation scheduler.
// Point positions and bouncing motion are computed by the GPU vertex shader.

const vertexShaderSource = `#version 300 es
precision highp float;

layout(location = 0) in vec2 a_point;
layout(location = 1) in vec4 a_flower;  // seed X/Y, velocity X/Y
layout(location = 2) in vec3 a_color;

uniform vec2 u_size;   // CSS pixel dimensions
uniform float u_time;  // seconds of active animation
uniform float u_dpr;   // pixel ratio for point sizing

out vec3 v_color;

float bounce(float start, float velocity, float limit, float t) {
    float length = 4.0 * limit;
    float phase = mod(start + limit + velocity * t, length);
    return limit - abs(phase - 2.0 * limit);
}

void main() {
    vec2 limit = max(u_size * 0.5 - vec2(30.0), vec2(1.0));
    vec2 start = a_flower.xy * limit;
    vec2 center = vec2(
        bounce(start.x, a_flower.z, limit.x, u_time),
        bounce(start.y, a_flower.w, limit.y, u_time)
    );
    vec2 position = center + a_point;

    // Position is centered in CSS pixels; WebGL clip space has upward Y.
    gl_Position = vec4(position.x * 2.0 / u_size.x,
                       -position.y * 2.0 / u_size.y, 0.0, 1.0);
    gl_PointSize = max(1.0, 3.0 * u_dpr);
    v_color = a_color;
}
`;

const fragmentShaderSource = `#version 300 es
precision highp float;

in vec3 v_color;
out vec4 outColor;

void main() {
    float distanceFromCenter = length(gl_PointCoord - vec2(0.5));
    float opacity = 1.0 - smoothstep(0.40, 0.50, distanceFromCenter);
    outColor = vec4(v_color, opacity);
}
`;

function compile(gl, type, source) {
    const shader = gl.createShader(type);
    if (!shader) throw new Error("Unable to allocate GPU shader");
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const error = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error("WebGL shader compilation failed: " + error);
    }
    return shader;
}

export function createRenderer(canvas, dotNetRef) {
    const gl = canvas.getContext("webgl2", {
        alpha: false,
        antialias: true,
        powerPreference: "high-performance",
        preserveDrawingBuffer: false
    });
    if (!gl) throw new Error("WebGL2 is required; no CPU rendering fallback is enabled.");

    const vertexShader = compile(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = compile(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        throw new Error("WebGL GPU shader link failed: " + gl.getProgramInfoLog(program));

    const geometryBuffer = gl.createBuffer();
    const instanceBuffer = gl.createBuffer();
    const vao = gl.createVertexArray();
    if (!geometryBuffer || !instanceBuffer || !vao)
        throw new Error("Unable to allocate GPU buffers");

    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, geometryBuffer);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 28, 0);
    gl.vertexAttribDivisor(1, 1);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 28, 16);
    gl.vertexAttribDivisor(2, 1);
    gl.bindVertexArray(null);

    const uSize = gl.getUniformLocation(program, "u_size");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uDpr = gl.getUniformLocation(program, "u_dpr");
    gl.clearColor(47 / 255, 79 / 255, 79 / 255, 1);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    let pointCount = 0;
    let instanceCount = 0;
    let frameHandle = 0;
    let disposed = false;
    let lastTime = null;
    let elapsedSeconds = 0;
    let sampleStart = null;
    let sampleFrames = 0;
    let smoothedFps = 0;
    let lastReportedFps = -1;
    let frameNumber = 0;
    const recent = [];

    function resize() {
        const rect = canvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const cssWidth = Math.max(1, rect.width);
        const cssHeight = Math.max(1, rect.height);
        const width = Math.max(1, Math.round(cssWidth * dpr));
        const height = Math.max(1, Math.round(cssHeight * dpr));
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
        }
        gl.viewport(0, 0, canvas.width, canvas.height);
        return { cssWidth, cssHeight, dpr };
    }

    function animate(timestamp) {
        if (disposed) return;
        if (lastTime !== null && !document.hidden)
            elapsedSeconds += Math.min((timestamp - lastTime) / 1000, 0.1);
        lastTime = timestamp;

        const { cssWidth, cssHeight, dpr } = resize();
        gl.clear(gl.COLOR_BUFFER_BIT);
        if (pointCount && instanceCount) {
            gl.useProgram(program);
            gl.bindVertexArray(vao);
            gl.uniform2f(uSize, cssWidth, cssHeight);
            gl.uniform1f(uTime, elapsedSeconds);
            gl.uniform1f(uDpr, dpr);
            gl.drawArraysInstanced(gl.POINTS, 0, pointCount, instanceCount);
            gl.bindVertexArray(null);
            frameNumber++;
            // A slow DOM diagnostic update, separate from the hot drawing path.
            if (frameNumber % 30 === 0)
                canvas.dataset.gpuFrames = String(frameNumber);
        }

        if (sampleStart === null) sampleStart = timestamp;
        sampleFrames++;
        if (timestamp - sampleStart >= 750) {
            const fps = Math.round(1000 * sampleFrames / (timestamp - sampleStart));
            smoothedFps = smoothedFps ? smoothedFps * 0.65 + fps * 0.35 : fps;
            recent.push(fps);
            if (recent.length > 10) recent.shift();
            const rounded = Math.round(smoothedFps);
            const low = Math.min(...recent);
            if (rounded !== lastReportedFps) {
                lastReportedFps = rounded;
                dotNetRef.invokeMethodAsync("ReportFrameRate", rounded, low)
                    .catch(() => {}); // The Blazor component may have been disposed.
            }
            sampleStart = timestamp;
            sampleFrames = 0;
        }

        frameHandle = requestAnimationFrame(animate);
    }

    const observer = new ResizeObserver(() => {
        if (!disposed) resize();
    });
    observer.observe(canvas);
    canvas.dataset.renderer = "webgl2";
    frameHandle = requestAnimationFrame(animate);

    return {
        setScene(points, flowers) {
            if (disposed) return;
            gl.bindBuffer(gl.ARRAY_BUFFER, geometryBuffer);
            if (points.length) {
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
                pointCount = points.length / 2;
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flowers), gl.DYNAMIC_DRAW);
            instanceCount = flowers.length / 7;
        },
        dispose() {
            if (disposed) return;
            disposed = true;
            cancelAnimationFrame(frameHandle);
            observer.disconnect();
            gl.deleteBuffer(geometryBuffer);
            gl.deleteBuffer(instanceBuffer);
            gl.deleteVertexArray(vao);
            gl.deleteProgram(program);
        }
    };
}
