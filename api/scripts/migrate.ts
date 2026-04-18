import * as fs from 'fs';
import * as path from 'path';
import { Client } from 'pg';

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

async function getClient(): Promise<Client> {
  const client = new Client({
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  });
  await client.connect();
  return client;
}

async function bootstrap(client: Client): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

async function up(client: Client): Promise<void> {
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.up.sql'))
    .sort();

  const { rows } = await client.query<{ name: string }>(
    'SELECT name FROM schema_migrations',
  );
  const applied = new Set(rows.map((r) => r.name));

  const pending = files.filter((f) => !applied.has(f.replace('.up.sql', '')));

  if (pending.length === 0) {
    console.log('No pending migrations.');
    return;
  }

  for (const file of pending) {
    const name = file.replace('.up.sql', '');
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [
        name,
      ]);
      await client.query('COMMIT');
      console.log(`Applied: ${name}`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }
  }
}

async function down(client: Client): Promise<void> {
  const { rows } = await client.query<{ name: string }>(
    'SELECT name FROM schema_migrations ORDER BY applied_at DESC LIMIT 1',
  );

  if (rows.length === 0) {
    console.log('No migrations to roll back.');
    return;
  }

  const name = rows[0].name;
  const file = path.join(MIGRATIONS_DIR, `${name}.down.sql`);

  if (!fs.existsSync(file)) {
    throw new Error(`Down migration not found: ${file}`);
  }

  const sql = fs.readFileSync(file, 'utf8');
  await client.query('BEGIN');
  try {
    await client.query(sql);
    await client.query('DELETE FROM schema_migrations WHERE name = $1', [name]);
    await client.query('COMMIT');
    console.log(`Rolled back: ${name}`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}

async function main() {
  const command = process.argv[2];
  if (command !== 'up' && command !== 'down') {
    console.error('Usage: ts-node scripts/migrate.ts <up|down>');
    process.exit(1);
  }

  const client = await getClient();
  try {
    await bootstrap(client);
    if (command === 'up') await up(client);
    else await down(client);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
