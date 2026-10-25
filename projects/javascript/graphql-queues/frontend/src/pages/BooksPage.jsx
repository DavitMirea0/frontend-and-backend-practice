import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';

const GET_BOOKS_AND_AUTHORS = gql`
  query GetBooksAndAuthors {
    books {
      id
      title
      year
      genre
      author {
        id
        name
        email
      }
    }
    authors {
      id
      name
      email
      country
      books {
        id
        title
      }
    }
  }
`;

const CREATE_BOOK = gql`
  mutation CreateBook($title: String!, $authorId: ID!, $year: Int, $genre: String) {
    createBook(title: $title, authorId: $authorId, year: $year, genre: $genre) {
      id
      title
      author {
        name
      }
    }
  }
`;

const CREATE_AUTHOR = gql`
  mutation CreateAuthor($name: String!, $email: String!, $country: String) {
    createAuthor(name: $name, email: $email, country: $country) {
      id
      name
      email
    }
  }
`;

function BooksPage() {
  const { loading, error, data } = useQuery(GET_BOOKS_AND_AUTHORS);
  const [createBook] = useMutation(CREATE_BOOK, {
    refetchQueries: [{ query: GET_BOOKS_AND_AUTHORS }],
  });
  const [createAuthor] = useMutation(CREATE_AUTHOR, {
    refetchQueries: [{ query: GET_BOOKS_AND_AUTHORS }],
  });

  const [bookForm, setBookForm] = useState({ title: '', authorId: '', year: '', genre: '' });
  const [authorForm, setAuthorForm] = useState({ name: '', email: '', country: '' });

  if (loading) return <div className="loading">Loading books...</div>;
  if (error) return <div className="loading">Error: {error.message}</div>;

  const handleAddBook = async (e) => {
    e.preventDefault();
    await createBook({
      variables: {
        title: bookForm.title,
        authorId: bookForm.authorId,
        year: parseInt(bookForm.year) || null,
        genre: bookForm.genre || null,
      },
    });
    setBookForm({ title: '', authorId: '', year: '', genre: '' });
  };

  const handleAddAuthor = async (e) => {
    e.preventDefault();
    await createAuthor({
      variables: {
        name: authorForm.name,
        email: authorForm.email,
        country: authorForm.country || null,
      },
    });
    setAuthorForm({ name: '', email: '', country: '' });
  };

  return (
    <div>
      <h1>📚 Book Catalog</h1>
      
      <div className="card">
        <h2>➕ Add New Author</h2>
        <form onSubmit={handleAddAuthor} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            placeholder="Name *"
            value={authorForm.name}
            onChange={(e) => setAuthorForm({ ...authorForm, name: e.target.value })}
            required
          />
          <input
            placeholder="Email *"
            type="email"
            value={authorForm.email}
            onChange={(e) => setAuthorForm({ ...authorForm, email: e.target.value })}
            required
          />
          <input
            placeholder="Country"
            value={authorForm.country}
            onChange={(e) => setAuthorForm({ ...authorForm, country: e.target.value })}
          />
          <button type="submit">Add Author</button>
        </form>
      </div>
      
      <div className="card">
        <h2>➕ Add New Book</h2>
        <form onSubmit={handleAddBook} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            placeholder="Title *"
            value={bookForm.title}
            onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
            required
          />
          <select
            value={bookForm.authorId}
            onChange={(e) => setBookForm({ ...bookForm, authorId: e.target.value })}
            required
          >
            <option value="">Select Author</option>
            {data?.authors.map(author => (
              <option key={author.id} value={author.id}>{author.name}</option>
            ))}
          </select>
          <input
            placeholder="Year"
            type="number"
            value={bookForm.year}
            onChange={(e) => setBookForm({ ...bookForm, year: e.target.value })}
          />
          <input
            placeholder="Genre"
            value={bookForm.genre}
            onChange={(e) => setBookForm({ ...bookForm, genre: e.target.value })}
          />
          <button type="submit">Add Book</button>
        </form>
      </div>
      
      <div className="grid">
        {data?.books.map(book => (
          <div key={book.id} className="book-card">
            <h3>{book.title}</h3>
            <p>by {book.author.name}</p>
            <p>Year: {book.year || 'N/A'} | Genre: {book.genre || 'N/A'}</p>
            <small>Author email: {book.author.email}</small>
          </div>
        ))}
      </div>
      
      <div className="card">
        <h2>👨‍💻 Authors</h2>
        {data?.authors.map(author => (
          <div key={author.id} style={{ marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
            <strong>{author.name}</strong> - {author.email}
            {author.country && <span> ({author.country})</span>}
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              Books: {author.books.map(b => b.title).join(', ') || 'No books yet'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BooksPage;