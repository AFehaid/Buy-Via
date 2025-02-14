import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';

// Load environment variables
export default defineConfig(({ mode }) => {
  // Load the correct .env file based on mode
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      cors: true,
      allowedHosts: [
        "localhost",
        "127.0.0.1",
        "buyvia-alb-1122165574.me-south-1.elb.amazonaws.com"  // Allow AWS ALB
      ],
      hmr: {
        clientPort: 443, // Ensure HMR works behind ALB
      },
    },
    define: {
      __API_URL__: JSON.stringify(
        env.VITE_DEPLOYMENT_ENVIRONMENT === 'PROD' ? env.VITE_API_URL : env.VITE_API_URL_DEV
      ),
    },
  };
});
