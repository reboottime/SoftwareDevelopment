export default class HttpClient {
  private readonly baseUri: string;
  private readonly options: HttpClientOptions;

  constructor(baseUri: string, options?: HttpClientOptions) {
    this.baseUri = baseUri;
    this.options = options ?? {};
  }

  private getRequestBody(body: unknown): { body: BodyInit | null | undefined } {
    if (body === undefined) {
      return { body };
    } else if (body instanceof FormData) {
      return { body } as { body: BodyInit };
    } else if (typeof body === "object") {
      return { body: JSON.stringify(body) };
    }

    return { body } as { body: BodyInit };
  }

  private async request<T>(conf: RequestConf): Promise<T | undefined> {
    const { apiPath, data, method, query } = conf;

    const search = query ? `?${new URLSearchParams(query).toString()}` : "";
    const url = `${this.baseUri}/${apiPath}${search}`;

    const reqestInit = {
      ...this.options,
      method: method.toUpperCase(),
      ...(data !== undefined && this.getRequestBody(data)),
      headers: {
        ...this.options.headers,
        ...conf.headers,
      },
    };

    const response = await fetch(url, reqestInit);
    const text = await response.text();

    // make sure the response http code is between 200~299
    if (response.ok) {
      // the response body could be empty
      if (text) {
        try {
          return JSON.parse(text) as T;
        } catch {
          // the response could be a string
          return text as T;
        }
      }

      return;
    }

    throw new Error(`HTTP error! status: ${response.status}, info: ${text}`);
  }

  delete<T>(conf: Omit<RequestConf, "method">): Promise<T | undefined> {
    return this.request({
      ...conf,
      method: "delete",
    });
  }

  get<T>(conf: Omit<RequestConf, "method" | "data">): Promise<T | undefined> {
    return this.request({
      ...conf,
      method: "get",
    });
  }

  patch<T>(conf: UpdateRequestConf): Promise<T | undefined> {
    return this.request({
      ...conf,
      method: "patch",
    });
  }

  post<T>(conf: UpdateRequestConf): Promise<T | undefined> {
    return this.request({
      ...conf,
      method: "post",
    });
  }

  put<T>(conf: UpdateRequestConf): Promise<T | undefined> {
    return this.request({
      ...conf,
      method: "put",
    });
  }
}

export interface HttpClientOptions {
  mode?: "no-cors" | "cors" | "same-origin";
  creadentials?: "omit" | "same-origin" | "include"; // the mechinsm about brining cookie to BE
  headers?: Record<string, string>;
}

interface RequestConf {
  apiPath: string;
  data?: unknown;
  method: "delete" | "get" | "post" | "patch" | "put";
  query?: Record<string, string> | string[][];
  headers?: HttpClientOptions["headers"];
}

interface UpdateRequestConf
  extends Required<Pick<RequestConf, "data" | "apiPath">> {
  headers: RequestConf["headers"];
}