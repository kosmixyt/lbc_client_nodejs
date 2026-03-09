import initCycleTLS, { type CycleTLSClient, type CycleTLSRequestOptions } from "cycletls";
import * as readline from "readline";
import * as fs from "fs/promises";
import * as path from "path";
import {
  type Proxy,
  type City,
  type LocationType,
  type SortValue,
  proxyUrl,
  Category,
  Sort,
  AdType,
  OwnerType,
} from "./models";
import { connect } from "puppeteer-real-browser";
import { DatadomeError, NotFoundError, RequestError } from "./exceptions";
import { buildSearchPayloadWithArgs } from "./utils";
import { buildSearchResult, buildUser, buildAd, type SearchResult, type Ad, type User } from "./types";

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function generateUserAgent(): string {
  const os = randomChoice(["iOS", "Android"]);
  if (os === "iOS") {
    const osVersion = randomChoice([
      "18.0", "18.1", "18.2", "18.3", "18.4", "18.5", "18.6", "18.7", "18.7.3",
      "26.0", "26.1", "26.2",
    ]);
    const model = "iPhone";
    const deviceId = crypto.randomUUID();
    const appVersion = randomChoice([
      "101.45.0", "101.44.0", "101.43.1", "101.43.0", "101.42.1",
      "101.42.0", "101.41.0", "101.40.0", "101.39.0", "101.38.0",
    ]);
    return `LBC;${os};${osVersion};${model};phone;${deviceId};wifi;${appVersion}`;
  } else {
    const osVersion = randomChoice(["11", "12", "13", "14", "15"]);
    const model = randomChoice([
      "SM-G991B", "SM-G996B", "SM-G998B", "SM-S911B", "SM-S916B", "SM-S918B",
      "SM-A505F", "SM-A546B", "SM-A137F", "SM-M336B",
      "Pixel 5", "Pixel 6", "Pixel 6a", "Pixel 7", "Pixel 7 Pro", "Pixel 8", "Pixel 8 Pro",
      "Mi 10", "Mi 11", "Mi 11 Lite", "Redmi Note 10", "Redmi Note 11", "Redmi Note 12",
      "POCO F3", "POCO F4", "POCO X3 Pro",
      "ONEPLUS A6003", "ONEPLUS A6013", "ONEPLUS A5000", "ONEPLUS A5010",
      "OnePlus 8", "OnePlus 9", "OnePlus 10 Pro", "OnePlus Nord",
    ]);
    const deviceId = crypto.randomUUID().replace(/-/g, "").substring(0, 16);
    const appVersion = randomChoice([
      "100.85.2", "100.84.1", "100.83.1", "100.82.0", "100.81.1",
    ]);
    return `LBC;${os};${osVersion};${model};phone;${deviceId};wifi;${appVersion}`;
  }
}

export interface ClientOptions {
  proxy?: Proxy;
  timeout?: number;
  maxRetries?: number;
}

// Cookies extracted from the browser after captcha solving
interface BrowserSession {
  cookieHeader: string;
  userAgent: string;
}

const COOKIE_PATH = path.join(process.cwd(), "lbc_session.json");

async function saveSession(session: BrowserSession) {
  try {
    await fs.writeFile(COOKIE_PATH, JSON.stringify(session), "utf8");
  } catch (e) {
    console.error(`[lbc] Failed to save session: ${e}`);
  }
}

async function loadSession(): Promise<BrowserSession | null> {
  try {
    const data = await fs.readFile(COOKIE_PATH, "utf8");
    return JSON.parse(data) as BrowserSession;
  } catch {
    return null;
  }
}

let solveCaptchaPromise: Promise<BrowserSession> | null = null;

async function solveCaptchaWithBrowser(url: string, proxy?: Proxy): Promise<BrowserSession> {
  if (solveCaptchaPromise) {
    return solveCaptchaPromise;
  }

  solveCaptchaPromise = (async () => {
    try {
      const connectOptions: Parameters<typeof connect>[0] = {
        headless: false,
        turnstile: false,
        disableXvfb: false,
        args: [],
        connectOption: {
          defaultViewport: null,
        }
      };

      if (proxy) {
        connectOptions.proxy = {
          host: proxy.host,
          port: typeof proxy.port === "string" ? parseInt(proxy.port, 10) : proxy.port,
          username: proxy.username,
          password: proxy.password,
        };
      }

      console.log("\n[lbc] Datadome detected — opening browser for captcha resolution...");
      console.log(`[lbc] URL: ${url}`);

      const { browser, page } = await connect(connectOptions);
      console.log("[lbc] Browser launched. Please solve the captcha to continue.");


      await page.goto(url, { waitUntil: "domcontentloaded" });
      console.log("[lbc] Waiting for captcha to be solved...");

      await new Promise<void>(async (resolve) => {
        console.log("[lbc] Unable to determine captcha element positions, please solve the captcha manually in the browser. Press Enter once done.");
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        rl.question("", () => {
          rl.close();
          resolve();
        });

      });

      // Extract cookies and user-agent
      const cookies = await page.cookies();
      const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
      const userAgent: string = await page.evaluate(() => navigator.userAgent);

      await browser.close();

      const session = { cookieHeader, userAgent };
      await saveSession(session);

      console.log("[lbc] Browser session captured and saved, resuming with real cookies.\n");

      return session;
    } finally {
      solveCaptchaPromise = null;
    }
  })();

  return solveCaptchaPromise;
}

export class Client {
  private cycleTLS: CycleTLSClient | null = null;
  private _proxy: Proxy | undefined;
  private _timeout: number;
  private _maxRetries: number;
  private _userAgent: string;
  private _ja3: string;
  private _cookieHeader: string = "";

  constructor(options: ClientOptions = {}) {
    this._proxy = options.proxy;
    this._timeout = options.timeout ?? 30;
    this._maxRetries = options.maxRetries ?? 5;
    this._userAgent = generateUserAgent();
    // Chrome Android JA3
    this._ja3 =
      "771,4865-4867-4866-49195-49199-52393-52392-49196-49200-49162-49161-49171-49172-51-57-47-53-10,0-23-65281-10-11-35-16-5-51-43-13-45-28-21,29-23-24-25-256-257,0";
  }

  async init(): Promise<this> {
    this.cycleTLS = await initCycleTLS();

    // Try to load existing session
    const savedSession = await loadSession();
    if (savedSession) {
      console.log("[lbc] Loaded saved session from lbc_session.json");
      this._cookieHeader = savedSession.cookieHeader;
      this._userAgent = savedSession.userAgent;
    }

    const probeUrl = "https://api.leboncoin.fr/finder/search";
    const probePayload = { filters: {}, limit: 1, disable_total: true, extend: false, listing_source: "direct-search" };

    try {
      await this._fetch("POST", probeUrl, probePayload, 0);
    } catch (e) {
      if (e instanceof DatadomeError) {
        // Session expired or blocked, solve captcha
        const session = await solveCaptchaWithBrowser("https://www.leboncoin.fr/", this._proxy);
        this._cookieHeader = session.cookieHeader;
        this._userAgent = session.userAgent;
      }
      // Other errors (NotFoundError etc.) are fine — the session is established
    }

    return this;
  }

  get proxy(): Proxy | undefined {
    return this._proxy;
  }

  set proxy(value: Proxy | undefined) {
    this._proxy = value;
  }

  private async _fetch(
    method: string,
    url: string,
    payload?: Record<string, any>,
    maxRetries?: number
  ): Promise<Record<string, any>> {
    if (!this.cycleTLS) {
      throw new RequestError("Client not initialized. Call client.init() first.");
    }

    const retries = maxRetries ?? this._maxRetries;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-site",
      "User-Agent": this._userAgent,
    };

    if (this._cookieHeader) {
      headers["Cookie"] = this._cookieHeader;
    }

    const requestOptions: CycleTLSRequestOptions = {
      ja3: this._ja3,
      userAgent: this._userAgent,
      headers,
      timeout: this._timeout,
    };

    if (this._proxy) {
      requestOptions.proxy = proxyUrl(this._proxy);
    }

    if (payload) {
      requestOptions.body = JSON.stringify(payload);
    }

    type HttpMethod = "head" | "get" | "post" | "put" | "delete" | "trace" | "options" | "connect" | "patch";
    const response = await this.cycleTLS(url, requestOptions, method.toLowerCase() as HttpMethod);

    if (response.status >= 200 && response.status < 300) {
      if (typeof response.data === "string") {
        try {
          return JSON.parse(response.data);
        } catch {
          return {} as Record<string, any>;
        }
      }
      return response.data as Record<string, any>;
    } else if (response.status === 403 || response.status === 495) {
      if (retries > 0) {
        // Re-init with new user agent and retry
        this._userAgent = generateUserAgent();
        return this._fetch(method, url, payload, retries - 1);
      }
      // Retries exhausted — try browser captcha solving if not already done
      if (!this._cookieHeader) {
        const session = await solveCaptchaWithBrowser("https://www.leboncoin.fr/", this._proxy);
        this._cookieHeader = session.cookieHeader;
        this._userAgent = session.userAgent;
        return this._fetch(method, url, payload, 0);
      }
      if (this._proxy) {
        throw new DatadomeError(
          "Access blocked by Datadome: your proxy appears to have a poor reputation, try to change it."
        );
      }
      throw new DatadomeError(
        "Access blocked by Datadome: your activity was flagged as suspicious. Please avoid sending excessive requests."
      );
    } else if (response.status === 404 || response.status === 410) {
      throw new NotFoundError("Unable to find ad or user.");
    } else {
      throw new RequestError(`Request failed with status code ${response.status}.`);
    }
  }

  // ── Search ──


  async search(options: SearchOptions ): Promise<SearchResult> {
    let payload: Record<string, any> = buildSearchPayloadWithArgs({
        text: options.text,
        category: options.category,
        sort: options.sort,
        locations: options.locations,
        limit: options.limit,
        limitAlu: options.limitAlu,
        page: options.page,
        adType: options.adType,
        ownerType: options.ownerType,
        shippable: options.shippable,
        searchInTitleOnly: options.searchInTitleOnly,
        extras: options.extras,
      });
    const body = await this._fetch("POST", "https://api.leboncoin.fr/finder/search", payload);
    return buildSearchResult(body);
  }

  // ── Get Ad ──
  async getAd(adId: string | number): Promise<Ad> {
    const body = await this._fetch(
      "GET",
      `https://api.leboncoin.fr/api/adfinder/v1/classified/${adId}`
    );
    return buildAd(body);
  }

  // ── Get User ──
  async getUser(userId: string): Promise<User> {
    const userData = await this._fetch(
      "GET",
      `https://api.leboncoin.fr/api/user-card/v2/${encodeURIComponent(userId)}/infos`
    );

    let proData: Record<string, any> | null = null;
    if (userData.account_type === "pro") {
      try {
        proData = await this._fetch(
          "GET",
          `https://api.leboncoin.fr/api/onlinestores/v2/users/${encodeURIComponent(userId)}?fields=all`
        );
      } catch (e) {
        if (!(e instanceof NotFoundError)) throw e;
      }
    }

    return buildUser(userData, proData);
  }

  // ── Cleanup ──
  async exit(): Promise<void> {
    if (this.cycleTLS) {
      await this.cycleTLS.exit();
      this.cycleTLS = null;
    }
  }
}

  export interface SearchOptions {
    text?: string;
    category?: Category;
    sort?: SortValue;
    locations?: LocationType | LocationType[];
    limit?: number;
    limitAlu?: number;
    page?: number;
    adType?: AdType;
    ownerType?: OwnerType;
    priceRange?: [number, number];
    shippable?: boolean;
    searchInTitleOnly?: boolean;
    extras?: Record<string, number[] | string[]>;
  }