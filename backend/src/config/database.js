import pkg from 'pg';
const { Pool } = pkg;

// Create connection pool using the PG_URL environment variable
// For development, fall back to a local PostgreSQL or handle connection errors gracefully
let pool;
try {
  pool = new Pool({
    connectionString: process.env.PG_URL,
    ssl: process.env.PG_URL?.includes('azure.com') ? {
      rejectUnauthorized: false
    } : false
  });
} catch (error) {
  console.warn('PostgreSQL connection failed, using fallback mode:', error.message);
  pool = null;
}

export function createConnection() {
  return pool;
}

export async function executeQuery(query, parameters = []) {
  if (!pool) {
    console.warn('Database not available, returning mock data');
    // Return mock data for development
    if (query.includes('SELECT') && query.includes('search_index')) {
      return [
        {
          id: 1,
          title: 'Sample Document',
          snippet: 'This is a sample document for testing purposes.',
          created_at: new Date(),
          uploader_name: 'Test User',
          filter_type: 'public'
        }
      ];
    }
    return [];
  }
  
  const client = await pool.connect();
  try {
    const result = await client.query(query, parameters);
    return result.rows;
  } finally {
    client.release();
  }
}

export async function initializeDatabase() {
  try {
    if (!pool) {
      console.log('Database not available, running in mock mode');
      return true;
    }
    
    console.log('Connecting to PostgreSQL database...');
    
    // Test connection
    await executeQuery('SELECT NOW()');
    console.log('Connected to PostgreSQL database');
    
    // Create tables if they don't exist
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await executeQuery(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size INTEGER NOT NULL,
        file_type VARCHAR(100) NOT NULL,
        is_public BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await executeQuery(`
      CREATE TABLE IF NOT EXISTS document_content (
        id SERIAL PRIMARY KEY,
        document_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        page_number INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
      )
    `);

    await executeQuery(`
      CREATE TABLE IF NOT EXISTS search_index (
        id SERIAL PRIMARY KEY,
        document_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        page_number INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better search performance
    await executeQuery(`
      CREATE INDEX IF NOT EXISTS idx_search_index_content 
      ON search_index USING gin(to_tsvector('english', content))
    `);

    await executeQuery(`
      CREATE INDEX IF NOT EXISTS idx_documents_user_id 
      ON documents(user_id)
    `);

    await executeQuery(`
      CREATE INDEX IF NOT EXISTS idx_documents_is_public 
      ON documents(is_public)
    `);

    console.log('Database tables initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}
