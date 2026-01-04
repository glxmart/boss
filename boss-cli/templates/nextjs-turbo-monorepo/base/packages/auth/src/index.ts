export { auth, signIn, signOut, handlers } from './config';
export type { Session } from 'next-auth';

// Import type augmentation
import './types';

/**
 * Get the server session
 * Use this in server components, route handlers, and server actions
 */
export { auth as getServerSession } from './config';
