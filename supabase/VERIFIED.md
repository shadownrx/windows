# Verified users (NEX Music)

## 1. Apply schema

In Supabase → SQL Editor, run:

`supabase/schema-profiles-v4.sql`

## 2. Users create a profile automatically

Opening NEX Music with a nickname upserts `user_profiles` (cannot self-verify).

## 3. Mark someone verified (admin)

In SQL Editor (as project owner):

```sql
select public.admin_verify_nickname('SuNickname', 'creator');
-- reasons: creator | artist | staff | partner
```

The user must have opened the app at least once with that nickname (so the profile row exists).

## 4. In the app

- Global playlists / comments show a blue ✓ next to verified nicknames
- Header: **Solicitar verificación ✓** → inserts `verification_requests`
- Review pending:

```sql
select * from verification_requests where status = 'pending' order by created_at desc;
```
