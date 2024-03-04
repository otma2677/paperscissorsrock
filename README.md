# Paper Scissors Rock
A tiny website to make PvP off of Paper Scissors Rock

# Quickstart
### Init the database
To connect to the database within bin script, you need to specify few things 
within a ".env" file at the root of your project;
```typescript
MYSQL_PORT: string;
MYSQL_HOST: string;
MYSQL_PASS: string;
MYSQL_USER: string;
MYSQL_SCHEMA: string;
MYSQL_SSL: string | undefined;
```


**Initialise your schema**

The script need the .env file, though MYSQL_SCHEMA is not used in the first command
and can be missing, you will be prompted to choose a name for the schema.

```bash
npm run db:initial-schema
```

The name you'd chosen should be provided as an environment variable under the 
name "MYSQL_SCHEMA".

**Initialise the migration table**, which will be used to keep track of
migration commands.

```bash
npm run db:initial-migration
```

From there, you can create file with a timestamp using the script

**Helper to create file with a timestamp**

```bash
npm run db:create-migration
```
You will be prompted a note (name kind of) and a comment, which are both optional,
and then the file is created.
