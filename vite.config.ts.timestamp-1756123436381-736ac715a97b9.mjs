// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.mjs";
var vite_config_default = defineConfig({
  plugins: [react()],
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV !== "production"),
    global: "window",
    global: "window"
  },
  resolve: {
    alias: {
      "react-native": "react-native-web"
    }
  },
  optimizeDeps: {
    exclude: ["lucide-react"],
    esbuildOptions: {
      loader: { ".js": "jsx" }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKV0sXG4gIGRlZmluZToge1xuICAgIF9fREVWX186IEpTT04uc3RyaW5naWZ5KHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpLFxuICAgIGdsb2JhbDogJ3dpbmRvdycsXG4gICAgZ2xvYmFsOiAnd2luZG93JyxcbiAgfSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAncmVhY3QtbmF0aXZlJzogJ3JlYWN0LW5hdGl2ZS13ZWInLFxuICAgIH0sXG4gIH0sXG4gIG9wdGltaXplRGVwczoge1xuICAgIGV4Y2x1ZGU6IFsnbHVjaWRlLXJlYWN0J10sXG4gICAgZXNidWlsZE9wdGlvbnM6IHtcbiAgICAgIGxvYWRlcjogeyAnLmpzJzogJ2pzeCcgfVxuICAgIH1cbiAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF5TixTQUFTLG9CQUFvQjtBQUN0UCxPQUFPLFdBQVc7QUFHbEIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLE1BQU0sQ0FBQztBQUFBLEVBQ2pCLFFBQVE7QUFBQSxJQUNOLFNBQVMsS0FBSyxVQUFVLFFBQVEsSUFBSSxhQUFhLFlBQVk7QUFBQSxJQUM3RCxRQUFRO0FBQUEsSUFDUixRQUFRO0FBQUEsRUFDVjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsZ0JBQWdCO0FBQUEsSUFDbEI7QUFBQSxFQUNGO0FBQUEsRUFDQSxjQUFjO0FBQUEsSUFDWixTQUFTLENBQUMsY0FBYztBQUFBLElBQ3hCLGdCQUFnQjtBQUFBLE1BQ2QsUUFBUSxFQUFFLE9BQU8sTUFBTTtBQUFBLElBQ3pCO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
