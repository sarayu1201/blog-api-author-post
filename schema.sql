-- Database Schema for Blog API

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS authors CASCADE;

-- Create authors table
CREATE TABLE authors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create posts table with foreign key constraint
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_authors_email ON authors(email);

-- Insert sample data
INSERT INTO authors (name, email) VALUES
  ('John Doe', 'john@example.com'),
  ('Jane Smith', 'jane@example.com'),
  ('Bob Johnson', 'bob@example.com');

INSERT INTO posts (title, content, author_id) VALUES
  ('First Blog Post', 'This is my first blog post about learning Node.js', 1),
  ('Learning PostgreSQL', 'PostgreSQL is a powerful relational database', 1),
  ('Web Development Tips', 'Here are some tips for web development', 2),
  ('API Best Practices', 'Building RESTful APIs with proper design', 2),
  ('JavaScript Async/Await', 'Understanding asynchronous programming', 3);
