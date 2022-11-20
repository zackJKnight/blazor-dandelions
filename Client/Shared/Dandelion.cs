using SkiaSharp;

public class Dandelion
{
    public List<SKPoint> points { get; set; } = new List<SKPoint>();
    public float moveX { get; set; } = 10f;
    public float moveY { get; set; } = 10f;
    public bool moveUp { get; set; } = true;
    public bool moveRight { get; set; } = true;
    public int moveSpeed { get; set; } = 1;
    public string startColorHex { get; set; } = "FFFF0000";

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