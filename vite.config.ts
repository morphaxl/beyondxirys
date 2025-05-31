import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5001,
    allowedHosts: [
      "beyond-gyan.replit.app",
      "gyan.beyondnetwork.xyz",
      "8f2fafa7-65db-44d3-a8d8-865584f7efe8-00-3mxqxk5jyhns5.picard.replit.dev",
    ],
  },
  preview: {
    host: "0.0.0.0",
    port: 5001,
    allowedHosts: [
      "beyond-gyan.replit.app",
      "gyan.beyondnetwork.xyz",
      "8f2fafa7-65db-44d3-a8d8-865584f7efe8-00-3mxqxk5jyhns5.picard.replit.dev",
    ],
  },
});
