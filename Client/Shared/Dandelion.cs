using SkiaSharp;

public class Dandelion
{
    public SKPoint[] points { get; set; }
    public SKColor color {get;set;} = SKColors.Black;
    public float moveX { get; set; } = 10f;
    public float moveY { get; set; } = 10f;
    public bool moveUp { get; set; } = true;
    public bool moveRight { get; set; } = true;
    public int moveSpeed { get; set; } = 1;

    public void Update(float hCenter, float vCenter, float pointScale)
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

        if (moveRight)
        {
            moveX = moveX + moveSpeed;
        }
        else
        {
            moveX = moveX - moveSpeed;
        }
        if (moveUp)
        {
            moveY = moveY + moveSpeed;
        }
        else
        {
            moveY = moveY - moveSpeed;
        }
    }
}