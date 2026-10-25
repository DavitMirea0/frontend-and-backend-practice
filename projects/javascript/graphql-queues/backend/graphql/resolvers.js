import { books, authors, getAuthor, getAuthorBooks, addBook, addAuthor, updateBook as updateBookInDb, deleteBook as deleteBookFromDb, updateAuthor as updateAuthorInDb, deleteAuthor as deleteAuthorFromDb, tasks, addTask, updateTaskStatus } from '../data/db.js';
import { sendTask } from '../rabbitmq/producer.js';
import { PubSub } from 'graphql-subscriptions';

const pubsub = new PubSub();

export const resolvers = {
  Query: {
    // Books
    books: () => books,
    book: (_, { id }) => books.find(b => b.id === id),
    booksByAuthor: (_, { authorId }) => books.filter(b => b.authorId === authorId),
    
    // Authors
    authors: () => authors,
    author: (_, { id }) => authors.find(a => a.id === id),
    
    // Tasks
    tasks: () => tasks,
    task: (_, { id }) => tasks.find(t => t.id === id),
  },

  Mutation: {
    // Book mutations
    createBook: (_, { title, authorId, year, genre }) => {
      const book = addBook({ title, authorId, year, genre });
      pubsub.publish('BOOK_ADDED', { bookAdded: book });
      return book;
    },
    updateBook: (_, { id, title, year, genre }) => updateBookInDb(id, { title, year, genre }),
    deleteBook: (_, { id }) => deleteBookFromDb(id),
    
    // Author mutations
    createAuthor: (_, { name, email, country }) => addAuthor({ name, email, country }),
    updateAuthor: (_, { id, name, email, country }) => updateAuthorInDb(id, { name, email, country }),
    deleteAuthor: (_, { id }) => deleteAuthorFromDb(id),
    
    // Task mutations with RabbitMQ
    createEmailTask: async (_, { to, subject, body }, { sendTask }) => {
      const task = {
        id: Date.now().toString(),
        type: 'email',
        payload: { to, subject, body },
        status: 'pending',
        createdAt: new Date().toISOString(),
        retryCount: 0
      };
      addTask(task);
      await sendTask(task);
      return task;
    },
    createNotificationTask: async (_, { email, message }, { sendTask }) => {
      const task = {
        id: Date.now().toString(),
        type: 'notification',
        payload: { email, message },
        status: 'pending',
        createdAt: new Date().toISOString(),
        retryCount: 0
      };
      addTask(task);
      await sendTask(task);
      return task;
    },
  },

  Subscription: {
    taskProcessed: {
      subscribe: () => pubsub.asyncIterator(['TASK_PROCESSED']),
    },
    bookAdded: {
      subscribe: () => pubsub.asyncIterator(['BOOK_ADDED']),
    },
  },

  Book: {
    author: (parent) => authors.find(a => a.id === parent.authorId),
  },

  Author: {
    books: (parent) => books.filter(b => b.authorId === parent.id),
  },
};