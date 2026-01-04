import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  /**
   * Extends the built-in session types to include user id
   */
  interface Session {
    user: {
      id?: string;
    } & DefaultSession['user'];
  }

  /**
   * Extends the built-in user type
   */
  interface User {
    id?: string;
  }
}
