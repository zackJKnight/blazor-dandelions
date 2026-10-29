using System.Net;
using BlazorApp.Shared;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;

namespace BlazorApp.Api;

public class WeatherForecastFunction
{
    [Function("WeatherForecast")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get")] HttpRequestData request)
    {
        var random = new Random();
        var forecast = Enumerable.Range(1, 5).Select(day =>
        {
            var temperature = random.Next(-20, 55);
            return new WeatherForecast
            {
                Date = DateTime.Now.AddDays(day),
                TemperatureC = temperature,
                Summary = temperature >= 32 ? "Hot"
                    : temperature > 0 && temperature <= 16 ? "Cold"
                    : temperature <= 0 ? "Freezing!"
                    : "Mild"
            };
        }).ToArray();

        var response = request.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(forecast);
        return response;
    }
}
