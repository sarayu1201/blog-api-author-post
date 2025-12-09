# Blog API - Author and Post Relationships

A RESTful Blog API with Author and Post relationships built with Node.js, Express, and PostgreSQL. This project demonstrates proper database design with foreign key constraints, CASCADE delete operations, and efficient query optimization to avoid N+1 problems.

## Features

- **Complete RESTful API** for managing authors and posts
- **One-to-many relationship** between authors and posts
- **Foreign key constraints** with CASCADE delete
- **Query optimization** using JOIN to avoid N+1 problems
- **Proper error handling** with meaningful HTTP status codes
- **Data validation** for all endpoints
- **PostgreSQL database** with proper schema design

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Relational database
- **pg (node-postgres)** - PostgreSQL client
- **dotenv** - Environment variable management
- **CORS** - Cross-Origin Resource Sharing

## Project Structure

```
blog-api-author-post/
├── server.js          # Main application file
├── schema.sql         # Database schema
├── package.json       # Dependencies and scripts
├── .env.example       # Environment variables template
├── .gitignore        # Git ignore rules
└── README.md         # Documentation
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sarayu1201/blog-api-author-post.git
   cd blog-api-author-post
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup PostgreSQL database**
   ```bash
   # Create database
   createdb blog_db
   
   # Run schema
   psql -d blog_db -f schema.sql
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your database credentials:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=blog_db
   DB_USER=postgres
   DB_PASSWORD=your_password
   PORT=3000
   ```

5. **Start the server**
   ```bash
   npm start
   ```
   The API will run on `http://localhost:3000`

## Database Schema

### Authors Table
```sql
CREATE TABLE authors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Posts Table
```sql
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE CASCADE
);
```

**Relationship**: One author can have many posts. When an author is deleted, all their posts are automatically deleted (CASCADE).

## API Documentation

### Base URL
```
http://localhost:3000
```

### Author Endpoints

#### 1. Create Author
```http
POST /authors
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com"
}
```
**Response (201 Created):**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "created_at": "2025-12-09T09:00:00.000Z"
}
```

#### 2. Get All Authors
```http
GET /authors
```
**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "created_at": "2025-12-09T09:00:00.000Z"
  }
]
```

#### 3. Get Author by ID
```http
GET /authors/1
```
**Response (200 OK):** Returns single author object
**Response (404 Not Found):** `{"error": "Author not found"}`

#### 4. Update Author
```http
PUT /authors/1
Content-Type: application/json

{
  "name": "John Updated",
  "email": "john.updated@example.com"
}
```

#### 5. Delete Author
```http
DELETE /authors/1
```
**Response (200 OK):** `{"message": "Author deleted successfully"}`

**Note:** Deleting an author will CASCADE delete all associated posts.

#### 6. Get Author's Posts
```http
GET /authors/1/posts
```
**Response (200 OK):** Returns array of all posts by that author

### Post Endpoints

#### 1. Create Post
```http
POST /posts
Content-Type: application/json

{
  "title": "My First Post",
  "content": "This is the content of my first post",
  "author_id": 1
}
```
**Response (201 Created):** Returns created post
**Response (400 Bad Request):** `{"error": "Author does not exist"}` if author_id is invalid

#### 2. Get All Posts
```http
GET /posts
```
**Response (200 OK):**
```json
[
  {
    "id": 1,
    "title": "My First Post",
    "content": "This is the content",
    "author_id": 1,
    "author_name": "John Doe",
    "author_email": "john@example.com",
    "created_at": "2025-12-09T09:00:00.000Z"
  }
]
```

**Note:** This endpoint uses JOIN to fetch author details efficiently (no N+1 problem).

#### 3. Filter Posts by Author
```http
GET /posts?author_id=1
```
Returns only posts by the specified author.

#### 4. Get Post by ID
```http
GET /posts/1
```
**Response (200 OK):** Returns post with author details
**Response (404 Not Found):** `{"error": "Post not found"}`

#### 5. Update Post
```http
PUT /posts/1
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "Updated content"
}
```

#### 6. Delete Post
```http
DELETE /posts/1
```
**Response (200 OK):** `{"message": "Post deleted successfully"}`

## Key Features Explained

### 1. CASCADE Delete
When an author is deleted, all their posts are automatically removed due to the `ON DELETE CASCADE` constraint:
```sql
FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE CASCADE
```

### 2. N+1 Query Prevention
The API uses JOIN queries to fetch related data efficiently:
```javascript
SELECT p.*, a.name as author_name, a.email as author_email
FROM posts p
JOIN authors a ON p.author_id = a.id
```
This fetches posts and author details in a single query instead of N+1 queries.

### 3. Data Validation
- Email uniqueness enforced at database level
- Required fields validated before insertion
- Foreign key validation prevents orphan posts
- Proper error responses with meaningful messages

### 4. Error Handling
- **400 Bad Request**: Invalid data or missing required fields
- **404 Not Found**: Resource doesn't exist
- **500 Internal Server Error**: Database or server errors

## Testing the API

### Using cURL

**Create an author:**
```bash
curl -X POST http://localhost:3000/authors \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@example.com"}'
```

**Create a post:**
```bash
curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Post","content":"Test content","author_id":1}'
```

**Get all posts:**
```bash
curl http://localhost:3000/posts
```

### Using Postman

1. Import the collection (if provided)
2. Set base URL to `http://localhost:3000`
3. Test each endpoint with sample data

## Development

**Run in development mode with auto-restart:**
```bash
npm run dev
```

## Project Requirements Met

✅ RESTful API with proper HTTP methods
✅ Author and Post models with correct relationships
✅ Foreign key constraints with CASCADE delete
✅ All CRUD operations for both entities
✅ Nested resource endpoint (`/authors/:id/posts`)
✅ Query parameter filtering (`?author_id=`)
✅ N+1 query problem avoided using JOIN
✅ Proper error handling and validation
✅ Author existence validation before creating posts
✅ 404 responses for non-existent resources
✅ Comprehensive documentation

## Author

VinayaSarayu Allampalli

## License

MIT
