import { API_URL, getToken } from "./api";

export type SocketStatus = "connecting" | "connected" | "disconnected" | "reconnecting" | "failed";
export type SocketEvent = {
  type: string;
  conversation_id?: number;
  message?: unknown;
  notification?: unknown;
};

type SocketOptions = {
  onEvent: (event: SocketEvent) => void;
  onStatus?: (status: SocketStatus) => void;
};

export class ReconnectingSocket {
  private socket: WebSocket | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private attempts = 0;
  private closed = false;

  constructor(private readonly options: SocketOptions) {}

  connect(): void {
    if (this.closed || this.socket?.readyState === WebSocket.OPEN || this.socket?.readyState === WebSocket.CONNECTING) return;
    const token = getToken();
    if (!token || typeof window === "undefined") return;

    this.options.onStatus?.(this.attempts ? "reconnecting" : "connecting");
    const url = API_URL.replace(/^http/, "ws").replace(/\/$/, "") + `/ws?token=${encodeURIComponent(token)}`;
    this.socket = new WebSocket(url);
    this.socket.onopen = () => {
      this.attempts = 0;
      this.options.onStatus?.("connected");
    };
    this.socket.onmessage = (event) => {
      try {
        this.options.onEvent(JSON.parse(event.data) as SocketEvent);
      } catch {
        // Ignore malformed events; HTTP remains authoritative.
      }
    };
    this.socket.onerror = () => this.options.onStatus?.("disconnected");
    this.socket.onclose = () => {
      this.socket = null;
      if (this.closed) return;
      this.options.onStatus?.("reconnecting");
      const delay = Math.min(30000, 1000 * 2 ** this.attempts++);
      this.retryTimer = setTimeout(() => this.connect(), delay);
    };
  }

  close(): void {
    this.closed = true;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.socket?.close();
    this.socket = null;
    this.options.onStatus?.("disconnected");
  }
}