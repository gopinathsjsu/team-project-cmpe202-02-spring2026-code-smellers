import "@testing-library/jest-dom";
import { TextDecoder, TextEncoder } from "util";

Object.assign(globalThis, { TextDecoder, TextEncoder });

/** Mirrors Vite `define` so modules that read `process.env.VITE_API_URL` load under Jest without `import.meta`. */
if (process.env.VITE_API_URL === undefined) {
  process.env.VITE_API_URL = "";
}

/** Minimal Web `Headers` / `Response` for Jest + jsdom (used by tests that `new Response(...)`). */
if (typeof globalThis.Headers === "undefined") {
  globalThis.Headers = class PolyfillHeaders {
    private readonly map = new Map<string, string>();

    constructor(init?: HeadersInit) {
      if (!init) return;
      if (typeof init === "string") {
        throw new TypeError("Invalid Headers init");
      }
      if (Array.isArray(init)) {
        for (const [k, v] of init) {
          this.map.set(String(k).toLowerCase(), String(v));
        }
        return;
      }
      for (const [k, v] of Object.entries(init)) {
        this.map.set(k.toLowerCase(), String(v));
      }
    }

    get(name: string): string | null {
      return this.map.get(name.toLowerCase()) ?? null;
    }
  } as unknown as typeof Headers;
}

if (typeof globalThis.Response === "undefined") {
  globalThis.Response = class PolyfillResponse {
    readonly ok: boolean;
    readonly status: number;
    readonly headers: Headers;
    private readonly _body: string;

    constructor(body: BodyInit | null, init: ResponseInit = {}) {
      const status = init.status ?? 200;
      this.status = status;
      this.ok = status >= 200 && status < 300;
      this.headers = init.headers instanceof Headers ? init.headers : new Headers(init.headers as HeadersInit);
      if (body == null) {
        this._body = "";
      } else if (typeof body === "string") {
        this._body = body;
      } else {
        this._body = "";
      }
    }

    async json(): Promise<unknown> {
      return this._body ? JSON.parse(this._body) : null;
    }

    async text(): Promise<string> {
      return this._body;
    }
  } as unknown as typeof Response;
}
