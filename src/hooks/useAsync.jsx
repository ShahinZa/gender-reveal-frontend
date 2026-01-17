import { useState, useCallback } from 'react';

/**
 * Custom hook for handling async operations
 * Provides loading, error, and data states
 */
const useAsync = () => {
  const [state, setState] = useState({
    loading: false,
    error: null,
    data: null,
  });

  const execute = useCallback(async (asyncFunction) => {
    setState({ loading: true, error: null, data: null });

    try {
      const data = await asyncFunction();
      setState({ loading: false, error: null, data });
      return { success: true, data };
    } catch (error) {
      setState({ loading: false, error: error.message, data: null });
      return { success: false, error: error.message };
    }
  }, []);

  const reset = useCallback(() => {
    setState({ loading: false, error: null, data: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
};

export default useAsync;
