const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'blog_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

// Middleware
app.use(cors());
app.use(express.json());

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected successfully');
  }
});

// Author Routes

// POST /authors - Create a new author
app.post('/authors', async (req, res) => {
  try {
    const { name, email } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    
    const result = await pool.query(
      'INSERT INTO authors (name, email) VALUES ($1, $2) RETURNING *',
      [name, email]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// GET /authors - Retrieve all authors
app.get('/authors', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM authors ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /authors/:id - Retrieve a single author by ID
app.get('/authors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM authors WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Author not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /authors/:id - Update an author
app.put('/authors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;
    
    const result = await pool.query(
      'UPDATE authors SET name = COALESCE($1, name), email = COALESCE($2, email) WHERE id = $3 RETURNING *',
      [name, email, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Author not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// DELETE /authors/:id - Delete an author (cascade delete posts)
app.delete('/authors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM authors WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Author not found' });
    }
    
    res.json({ message: 'Author deleted successfully', author: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /authors/:id/posts - Retrieve all posts for a specific author
app.get('/authors/:id/posts', async (req, res) => {
  try {
    const { id } = req.params;
    
    // First check if author exists
    const authorCheck = await pool.query('SELECT * FROM authors WHERE id = $1', [id]);
    if (authorCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Author not found' });
    }
    
    const result = await pool.query(
      'SELECT * FROM posts WHERE author_id = $1 ORDER BY id',
      [id]
    );
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Post Routes

// POST /posts - Create a new post
app.post('/posts', async (req, res) => {
  try {
    const { title, content, author_id } = req.body;
    
    if (!title || !content || !author_id) {
      return res.status(400).json({ error: 'Title, content, and author_id are required' });
    }
    
    // Check if author exists
    const authorCheck = await pool.query('SELECT * FROM authors WHERE id = $1', [author_id]);
    if (authorCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Author does not exist' });
    }
    
    const result = await pool.query(
      'INSERT INTO posts (title, content, author_id) VALUES ($1, $2, $3) RETURNING *',
      [title, content, author_id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /posts - Retrieve all posts (with optional author_id filter)
app.get('/posts', async (req, res) => {
  try {
    const { author_id } = req.query;
    
    let query;
    let params;
    
    if (author_id) {
      // Filter by author_id and include author details (efficient with JOIN)
      query = `
        SELECT p.*, a.name as author_name, a.email as author_email
        FROM posts p
        JOIN authors a ON p.author_id = a.id
        WHERE p.author_id = $1
        ORDER BY p.id
      `;
      params = [author_id];
    } else {
      // Get all posts with author details (avoid N+1 problem with JOIN)
      query = `
        SELECT p.*, a.name as author_name, a.email as author_email
        FROM posts p
        JOIN authors a ON p.author_id = a.id
        ORDER BY p.id
      `;
      params = [];
    }
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /posts/:id - Retrieve a single post by ID with author details
app.get('/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Use JOIN to get post with author details (efficient, avoids N+1)
    const result = await pool.query(
      `SELECT p.*, a.name as author_name, a.email as author_email
       FROM posts p
       JOIN authors a ON p.author_id = a.id
       WHERE p.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /posts/:id - Update a post
app.put('/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    
    const result = await pool.query(
      'UPDATE posts SET title = COALESCE($1, title), content = COALESCE($2, content) WHERE id = $3 RETURNING *',
      [title, content, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /posts/:id - Delete a post
app.delete('/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM posts WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.json({ message: 'Post deleted successfully', post: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Blog API Server - Author and Post Management' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
