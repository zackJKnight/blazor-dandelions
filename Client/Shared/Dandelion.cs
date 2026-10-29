using SkiaSharp;

public class Dandelion
{
    public SKColor color {get;set;} = SKColors.Black;
    public float moveX { get; set; } = 10f;
    public float moveY { get; set; } = 10f;
    public bool moveUp { get; set; } = true;
    public bool moveRight { get; set; } = true;
    public int moveSpeed { get; set; } = 1;

    public void Update(float hCenter, float vCenter, float pointScale, float deltaSeconds)
    {
        if (moveX >= hCenter - pointScale
            || moveX <= (0 - (hCenter - pointScale)))
        {
            moveRight = !moveRight;
        }
        if (moveY >= vCenter - pointScale
        || moveY <= (0 - (vCenter - pointScale)))
        {
            moveUp = !moveUp;
        }

        // Retain the original feel at 60 FPS while decoupling motion from render rate.
        var distance = moveSpeed * (60f * deltaSeconds);

        if (moveRight)
        {
            moveX += distance;
        }
        else
        {
            moveX -= distance;
        }
        if (moveUp)
        {
            moveY += distance;
        }
        else
        {
            moveY -= distance;
        }
    }
}