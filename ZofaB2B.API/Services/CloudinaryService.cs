using System.Net.Http.Headers;
using System.Text.Json;

namespace ZofaB2B.API.Services
{
    public class CloudinaryService
    {
        private readonly IConfiguration _config;
        private readonly HttpClient _http;

        public CloudinaryService(IConfiguration config, IHttpClientFactory httpFactory)
        {
            _config = config;
            _http = httpFactory.CreateClient();
        }

        public async Task<string?> UploadBase64Async(string base64Data, string folder)
        {
            try
            {
                var cloudName = _config["Cloudinary:CloudName"]!;
                var apiKey = _config["Cloudinary:ApiKey"]!;
                var apiSecret = _config["Cloudinary:ApiSecret"]!;

                var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
                var signature = GenerateSignature(timestamp, folder, apiSecret);

                var content = new MultipartFormDataContent();
                content.Add(new StringContent(base64Data), "file");
                content.Add(new StringContent(folder), "folder");
                content.Add(new StringContent(timestamp), "timestamp");
                content.Add(new StringContent(apiKey), "api_key");
                content.Add(new StringContent(signature), "signature");

                var response = await _http.PostAsync(
                    $"https://api.cloudinary.com/v1_1/{cloudName}/image/upload",
                    content);

                if (!response.IsSuccessStatusCode) return null;

                var json = await response.Content.ReadAsStringAsync();
                var doc = JsonDocument.Parse(json);
                return doc.RootElement.GetProperty("secure_url").GetString();
            }
            catch
            {
                return null;
            }
        }

        private static string GenerateSignature(string timestamp, string folder, string apiSecret)
        {
            var toSign = $"folder={folder}&timestamp={timestamp}{apiSecret}";
            using var sha1 = System.Security.Cryptography.SHA1.Create();
            var bytes = sha1.ComputeHash(System.Text.Encoding.UTF8.GetBytes(toSign));
            return BitConverter.ToString(bytes).Replace("-", "").ToLower();
        }
    }
}
