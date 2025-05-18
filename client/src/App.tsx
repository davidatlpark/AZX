import { isHTTPError } from './utils/errors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { theme } from './theme';
import { Router } from './Router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry for certain HTTP error status codes
        if (
          // Check for Ky HTTP errors with specific status codes
          isHTTPError(error, [401, 403, 404, 500])
        ) {
          return false;
        }

        // For all other errors, retry up to 3 times
        return failureCount < 3;
      },
    },
  },
});


export default function App() {
  return (
    <MantineProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <Router/>
      </QueryClientProvider>
    </MantineProvider>
  )
}
