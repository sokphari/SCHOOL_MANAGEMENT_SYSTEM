export type NoticeTone = "success" | "error" | "info";

export interface AppNotice {
  id: number;
  tone: NoticeTone;
  message: string;
}

export function notify(message: string, tone: NoticeTone = "success") {
  if (!message || typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<AppNotice>("school:notice", {
    detail: { id: Date.now() + Math.random(), tone, message },
  }));
}
