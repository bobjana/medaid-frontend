import { logChatBackend } from './lib/api/backend';

export function register() {
  if (process.env.NODE_ENV === 'development') {
    logChatBackend();
  }
}
