import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';

/**
 * Reusable Functions client module (Task 79)
 */

export const FunctionsClient = {
  call: async (name, data) => {
    const fn = httpsCallable(functions, name);
    const res = await fn(data);
    return res.data;
  }
};

export default FunctionsClient;
