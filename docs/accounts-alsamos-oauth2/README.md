# Alsamos OAuth2 Authorization Server

Bu fayllarni accounts.alsamos.com loyihasiga ko'chiring.

## Fayl tuzilmasi

```
accounts.alsamos.com/
├── src/
│   ├── pages/
│   │   ├── Authorize.tsx          # OAuth2 consent sahifasi
│   │   ├── Login.tsx              # Login sahifasi
│   │   └── Register.tsx           # Ro'yxatdan o'tish
│   ├── lib/
│   │   └── oauth2.ts              # OAuth2 yordamchi funksiyalar
│   └── App.tsx                    # Route qo'shish kerak
├── supabase/
│   ├── functions/
│   │   ├── oauth-authorize/       # Authorization endpoint
│   │   ├── oauth-token/           # Token endpoint
│   │   └── oauth-verify/          # Token verification
│   ├── migrations/
│   │   └── oauth_tables.sql       # Database jadvallar
│   └── config.toml                # Edge function config
└── docs/
    └── oauth2-flow.md             # Dokumentatsiya
```

## O'rnatish tartibi

1. Database migratsiyasini ishga tushiring (oauth_tables.sql)
2. Edge functionlarni ko'chiring
3. Frontend sahifalarini qo'shing
4. App.tsx da routelarni qo'shing
5. config.toml ni yangilang

## Registered Clients

mail.alsamos.com quyidagi client sifatida ro'yxatdan o'tkazilgan:
- client_id: "mail.alsamos.com"
- redirect_uri: "https://[preview-url]/auth/callback"
