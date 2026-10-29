// The Blazor component owns the instances and uploads their parameters to WebGL2.
// Their motion and per-point positions are evaluated by the GPU vertex shader.
public sealed class Dandelion
{
    public float SeedX { get; set; }
    public float SeedY { get; set; }
    public float VelocityX { get; set; }
    public float VelocityY { get; set; }
    public uint ColorRgb { get; set; }
}
