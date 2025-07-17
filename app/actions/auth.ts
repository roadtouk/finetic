"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Jellyfin } from "@jellyfin/sdk";
import { SystemApi } from "@jellyfin/sdk/lib/generated-client/api/system-api";
import { Configuration } from "@jellyfin/sdk/lib/generated-client/configuration";
import { UserDto } from "@jellyfin/sdk/lib/generated-client/models/user-dto";

// Type aliases for easier use
type JellyfinUserWithToken = UserDto & { AccessToken?: string };

// Create global Jellyfin SDK instance
const jellyfin = new Jellyfin({
  clientInfo: {
    name: "Finetic",
    version: "1.0.0",
  },
  deviceInfo: {
    name: "Finetic Web Client",
    id: "finetic-web-client",
  },
});

export async function setServerUrl(url: string) {
  const cookieStore = await cookies();
  cookieStore.set("jellyfin-server-url", url, {
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function getServerUrl(): Promise<string | null> {
  const cookieStore = await cookies();
  const serverUrl = cookieStore.get("jellyfin-server-url");
  return serverUrl?.value || null;
}

export async function checkServerHealth(url: string): Promise<boolean> {
  try {
    const systemApi = new SystemApi(new Configuration({ basePath: url }));
    const { data } = await systemApi.getPublicSystemInfo();
    return Boolean(data.ServerName);
  } catch (error) {
    console.error("Server health check failed:", error);
    return false;
  }
}

export async function authenticateUser(
  username: string,
  password: string
): Promise<boolean> {
  const serverUrl = await getServerUrl();
  if (!serverUrl) return false;

  try {
    const api = jellyfin.createApi(serverUrl);
    const { data: result } = await api.authenticateUserByName(
      username,
      password
    );

    if (result.AccessToken) {
      const userWithToken = { ...result.User, AccessToken: result.AccessToken };

      // Save auth data to cookies
      const cookieStore = await cookies();
      cookieStore.set(
        "jellyfin-auth",
        JSON.stringify({
          serverUrl,
          user: userWithToken,
        }),
        {
          path: "/",
          maxAge: 60 * 60 * 24 * 7, // 7 days
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        }
      );

      return true;
    }
  } catch (error) {
    console.error("Authentication failed", error);
  }
  return false;
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("jellyfin-auth");
  cookieStore.delete("jellyfin-server-url");
  redirect("/login");
}

export async function getUser(): Promise<JellyfinUserWithToken | null> {
  const cookieStore = await cookies();
  const authData = cookieStore.get("jellyfin-auth");

  if (!authData?.value) {
    return null;
  }

  try {
    const parsed = JSON.parse(authData.value);
    return parsed.user || null;
  } catch {
    return null;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const user = await getUser();
  const serverUrl = await getServerUrl();
  return !!(user && serverUrl);
}
