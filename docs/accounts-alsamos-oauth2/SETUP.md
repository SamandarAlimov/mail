# accounts.alsamos.com OAuth2 Server O'rnatish

## Qadam 1: Database Migration

accounts.alsamos.com loyihasida database migratsiyasini ishga tushiring:

```sql
-- supabase/migrations/001_oauth_tables.sql faylidan ko'chiring
```

## Qadam 2: Edge Functions

Quyidagi edge functionlarni `supabase/functions/` papkasiga ko'chiring:

1. `oauth-authorize/index.ts`
2. `oauth-token/index.ts`
3. `oauth-verify/index.ts`
4. `oauth-issue-code/index.ts`

## Qadam 3: Config

`supabase/config.toml` ga quyidagilarni qo'shing:

```toml
[functions.oauth-authorize]
verify_jwt = false

[functions.oauth-token]
verify_jwt = false

[functions.oauth-verify]
verify_jwt = false

[functions.oauth-issue-code]
verify_jwt = false
```

## Qadam 4: Frontend

1. `src/pages/Authorize.tsx` faylini ko'chiring
2. `App.tsx` ga route qo'shing:
   ```tsx
   <Route path="/authorize" element={<AuthorizePage />} />
   ```

## Qadam 5: Environment Variables

Edge functions uchun quyidagi environment variable qo'shing:

```
ACCOUNTS_URL=https://accounts.alsamos.com
```

## Qadam 6: mail.alsamos.com redirect URI

`oauth_clients` jadvaliga mail.alsamos.com preview URL ini qo'shing:

```sql
UPDATE public.oauth_clients 
SET redirect_uris = array_append(redirect_uris, 'https://YOUR-PREVIEW-URL/auth/callback')
WHERE client_id = 'mail.alsamos.com';
```

## Test qilish

1. mail.alsamos.com da "Sign in with Alsamos Account" tugmasini bosing
2. accounts.alsamos.com/authorize sahifasiga redirect bo'ladi
3. Login yoki ro'yxatdan o'ting
4. "Allow" tugmasini bosing
5. mail.alsamos.com ga qaytasiz

## Xavfsizlik eslatmalari

1. Production da HTTPS ishlatilishi SHART
2. redirect_uris ro'yxatini tekshiring - faqat ishonchli URL lar bo'lsin
3. Authorization code 10 daqiqada eskiradi
4. Access token 1 soatda eskiradi
5. Refresh token 30 kunda eskiradi
