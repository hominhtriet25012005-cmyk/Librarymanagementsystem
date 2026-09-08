import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.js"],
    include: ["tests/**/*.test.{js,jsx}"],
    // Các bài giao diện khá nặng; chạy từng file giúp thời gian phản hồi ổn định trên máy phát triển.
    fileParallelism: false,
    testTimeout: 15000,
  },
});
