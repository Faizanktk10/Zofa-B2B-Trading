# TODO (ZofaB2B Trading)

## Warning fixes (ASP.NET)
- [x] Program.cs me production HTTPS redirect ke warnings ko avoid karne ke liye `EnableHttpsRedirection` flag introduce kiya.
- [ ] Deployment (Render/Container) me `/data` persistent volume ensure karo taa ke DataProtection keys persist ho.
- [ ] Agar available ho, production me `DATAPROTECTION_CERT_THUMBPRINT` set karke DataProtection keys encryption enable karo.
- [ ] Hosting config me `ASPNETCORE_URLS`/port override (8080 vs PORT) remove/align karo taa ke Kestrel override warning kam ho.

## Login improvement
- [ ] If user mobile number input karta hai, backend me login ko phone-normalize + phone/email accept karna.

