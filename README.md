# Dandelions (.NET 10 upgrade)

A Blazor WebAssembly **WebGL2 GPU drawing demo**, with a small Azure Functions weather API.

## GPU architecture

The dandelion scene is authored in C# / Blazor: UI controls, point geometry, flower colors, initial seeds, and velocities. A small JS interop module (`Client/wwwroot/js/dandelions-gpu.js`) initializes a real **WebGL2** context and uploads point/flower buffers only when scene settings change.

The WebGL2 vertex shader computes movement and expands each flower from one shared point pattern via **instanced rendering** (`gl.drawArraysInstanced`). Animation runs with `requestAnimationFrame` and a single draw call per frame regardless of flower count. Blazor receives only infrequent FPS updates rather than per-frame interop.

There is deliberately **no CPU canvas fallback**. If WebGL2 is unavailable, the app displays an error. The Playwright startup test asserts that the canvas has a WebGL2 context and has issued drawing frames; visibility alone does not count as a pass. On CI, WebGL2 may be backed by a software driver (e.g., SwiftShader), so passing CI demonstrates use of the GPU API, not that a physical GPU was used. For the full demo, test on a hardware-accelerated browser/device.



## Requirements

- .NET 10 SDK
- Node.js 22 and npm (only for browser tests)
- Azure Functions Core Tools v4 (only to run the API locally)

## Run locally

```bash
dotnet restore BlazorStaticWebApps.sln
dotnet run --project Client/Client.csproj --urls http://127.0.0.1:5000
```

The canvas app opens at `http://127.0.0.1:5000`. The API can be started separately from `Api` using Azure Functions Core Tools v4. Copy `Api/local.settings.example.json` to `Api/local.settings.json` first.

## Build and smoke test

```bash
dotnet workload install wasm-tools
dotnet build BlazorStaticWebApps.sln -c Release
dotnet publish Client/Client.csproj -c Release -o artifacts/client
dotnet publish Api/Api.csproj -c Release -o artifacts/api
npm ci
npx playwright install chromium webkit
npx playwright test
```

The `.github/workflows/dotnet10-validation.yml` workflow builds both projects and runs desktop Chromium, mobile Chromium, and mobile WebKit smoke tests on pull requests.

## Azure Static Web Apps

The app is configured to deploy when changes are merged to `main`; pull requests use the Azure preview environment. The workflow first publishes with the .NET 10 SDK and then uploads the built output with the build skipped in Azure's deploy action. This avoids relying on the Oryx build image to provide the SDK.

The managed API uses `dotnet-isolated:10.0`, configured in `Client/wwwroot/staticwebapp.config.json`. Azure requires the secret `AZURE_STATIC_WEB_APPS_API_TOKEN_BLACK_GLACIER_0D8930410` for deployment.

The separate `ApiIsolated` example remains in the solution for compatibility with the original repository structure; the deployed function code lives in `Api`.
