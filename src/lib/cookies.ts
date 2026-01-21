// @interface(cookie sessions)
export interface CookieOptions {
  path?: string;
  domain?: string;
  maxAge?: number;
  expires?: Date;
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
}

// @set(cookie sessions)
export function setCookie(
  name: string,
  value: string,
  options: CookieOptions = {}
): void {
  if (typeof document === "undefined") return;

  const {
    path = "/",
    maxAge,
    expires,
    secure = true,
    sameSite = "lax",
  } = options;

  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (path) cookie += `; path=${path}`;
  if (maxAge) cookie += `; max-age=${maxAge}`;
  if (expires) cookie += `; expires=${expires?.toUTCString()}`;
  if (secure) cookie += "; secure";
  if (sameSite) cookie += `; samesite=${sameSite}`;

  document.cookie = cookie;
}

// @get(cookies value)
export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const nameEQ = `${encodeURIComponent(name)}=`;
  const cookies = document.cookie.split(";");

  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith(nameEQ)) {
      return decodeURIComponent(cookie.substring(nameEQ.length));
    }
  }

  return null;
}

// @delete(cookie sessions)
export function deleteCookie(name: string, path: string = "/"): void {
  if (typeof document === "undefined") return;
  document.cookie = `${encodeURIComponent(name)}=; path=${path}; max-age=0`;
}

// @get-all(order item sessions)
export function getOrderItemIds(): string[] {
  const cookieValue = getCookie("grand_items");
  if (!cookieValue) return [];

  try {
    return JSON.parse(cookieValue);
  } catch {
    return [];
  }
}

// @set(order item sessions)
export function setOrderItemIds(ids: string[]): void {
  setCookie("grand_items", JSON.stringify(ids), {
    maxAge: 60 * 60 * 24 * 1, // @ 1 days
  });
}

// @added(order item sessions)
export function addOrderItemId(id: string): void {
  const ids = getOrderItemIds();
  if (!ids.includes(id)) {
    ids.push(id);
    setOrderItemIds(ids);
  }
}

// @remove(order item sessions)
export function removeOrderItemId(id: string): void {
  const ids = getOrderItemIds();
  const filtered = ids.filter((itemId) => itemId !== id);
  setOrderItemIds(filtered);
}

// @clear(order item sessions)
export function clearOrderItemIds(): void {
  deleteCookie("grand_items");
}

// @get(guest sessions)
export function getGuestSessionId(): string | null {
  return getCookie("guest_sessions");
}

// @set(guest sessions)
export function setGuestSessionId(id: string): void {
  setCookie("guest_sessions", id, {
    maxAge: 60 * 60 * 24 * 1, // @ 1 days
  });
}

// @clear(guest sessions)
export function clearGuestSessionId(): void {
  deleteCookie("guest_sessions");
}

// @get(current order item sessions)
export function getOrderId(): string | null {
  return getCookie("grand_orders");
}

// @set(current order item sessions)
export function setOrderId(id: string): void {
  setCookie("grand_orders", id, {
    maxAge: 60 * 60 * 24 * 1, // @ 1 days
  });
}

// @clear(order id item from cookies)
export function clearOrderId(): void {
  deleteCookie("grand_orders");
}
