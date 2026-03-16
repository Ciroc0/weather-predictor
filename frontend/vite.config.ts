import path from "path"
import type { IncomingMessage, ServerResponse } from "node:http"
import react from "@vitejs/plugin-react"
import { defineConfig, type ViteDevServer } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'
// @ts-expect-error Local Vercel function is authored in plain JS.
import dashboardHandler from "./api/dashboard.js"

function vercelApiDevPlugin() {
  return {
    name: "vercel-api-dev",
    configureServer(server: ViteDevServer) {
      server.middlewares.use("/api/dashboard", async (req, res) => {
        const nodeReq = req as IncomingMessage & { method?: string }
        const nodeRes = res as ServerResponse
        const response = {
          setHeader(name: string, value: string) {
            nodeRes.setHeader(name, value)
          },
          status(code: number) {
            nodeRes.statusCode = code
            return response
          },
          json(payload: unknown) {
            if (!nodeRes.headersSent) {
              nodeRes.setHeader("Content-Type", "application/json; charset=utf-8")
            }
            nodeRes.end(JSON.stringify(payload))
          },
          end(body?: string) {
            nodeRes.end(body)
          },
        }

        try {
          await dashboardHandler(nodeReq, response)
        } catch (error) {
          nodeRes.statusCode = 500
          nodeRes.setHeader("Content-Type", "application/json; charset=utf-8")
          nodeRes.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : "Unknown API error",
            }),
          )
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vercelApiDevPlugin(), inspectAttr(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
