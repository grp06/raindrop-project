import type { QueryResponse } from "@/types/query"

const API_BASE_URL = import.meta.env.VITE_API_URL || ""

export async function queryBackend(prompt: string) {
  const response = await fetch(`${API_BASE_URL}/api/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  })

  let data: QueryResponse
  try {
    data = (await response.json()) as QueryResponse
  } catch {
    throw new Error("Backend returned invalid JSON.")
  }

  return { ok: response.ok, status: response.status, data }
}
