export const typeDefs = `#graphql
  type Book {
    id: ID!
    title: String!
    author: Author!
    authorId: ID!
    year: Int
    genre: String
  }

  type Author {
    id: ID!
    name: String!
    email: String!
    country: String
    books: [Book!]!
  }

  type TaskPayload {
    to: String
    subject: String
    body: String
    email: String
    message: String
  }

  type Task {
    id: ID!
    type: String!
    payload: TaskPayload!
    status: String!
    createdAt: String!
    processedAt: String
    retryCount: Int
  }

  type Query {
    books: [Book!]!
    book(id: ID!): Book
    booksByAuthor(authorId: ID!): [Book!]!
    authors: [Author!]!
    author(id: ID!): Author
    tasks: [Task!]!
    task(id: ID!): Task
  }

  type Mutation {
    createBook(title: String!, authorId: ID!, year: Int, genre: String): Book!
    updateBook(id: ID!, title: String, year: Int, genre: String): Book!
    deleteBook(id: ID!): Boolean!
    createAuthor(name: String!, email: String!, country: String): Author!
    updateAuthor(id: ID!, name: String, email: String, country: String): Author!
    deleteAuthor(id: ID!): Boolean!
    createEmailTask(to: String!, subject: String!, body: String!): Task!
    createNotificationTask(email: String!, message: String!): Task!
  }

  type Subscription {
    taskProcessed: Task!
    bookAdded: Book!
  }
`;