[Supabase JavaScript Reference Documentation](https://supabase.com/docs/reference/javascript/introduction)

[Generating TypeScript Types](https://supabase.com/docs/guides/api/rest/generating-types)
Already generated in src/types/database.types.ts
The database schema may change from time to time and it is possible you can get type errors on otherwise functioning code. To update database.types.ts regularly run:
```sh
npm run sb-types
```