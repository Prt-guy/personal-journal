// The single place the Appwrite SDK is imported and the client is initialized.
// Every other module imports `account` / `databases` / helpers from the service
// layer — no page or component touches the SDK directly.
import { Client, Account, Databases, ID, Query, Permission, Role } from 'appwrite';
import { APPWRITE } from '../utils/constants';

const client = new Client();

if (APPWRITE.endpoint && APPWRITE.projectId) {
  client.setEndpoint(APPWRITE.endpoint).setProject(APPWRITE.projectId);
} else {
  // Surfaced loudly in dev so a missing .env is obvious rather than a cryptic 401.
  console.warn(
    '[appwrite] Missing VITE_APPWRITE_ENDPOINT / VITE_APPWRITE_PROJECT_ID. ' +
      'Copy .env.example to .env and fill in your Appwrite project details.'
  );
}

export const account = new Account(client);
export const databases = new Databases(client);

// Re-export the SDK primitives the service modules need so they, too, never
// import `appwrite` directly.
export { ID, Query, Permission, Role };
export default client;
