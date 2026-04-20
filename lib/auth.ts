import NextAuth from "next-auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    {
      id: "strava",
      name: "Strava",
      type: "oauth",
      clientId: process.env.STRAVA_CLIENT_ID!,
      clientSecret: process.env.STRAVA_CLIENT_SECRET!,
      authorization: {
        url: "https://www.strava.com/oauth/authorize",
        params: {
          scope: "activity:read_all,profile:read_all",
          response_type: "code",
          approval_prompt: "auto",
        },
      },
      token: "https://www.strava.com/oauth/token",
      userinfo: "https://www.strava.com/api/v3/athlete",
      client: {
        token_endpoint_auth_method: "client_secret_post",
      },
      checks: ["state"] as ["state"],
      profile(profile) {
        return {
          id: String(profile.id),
          name: `${profile.firstname} ${profile.lastname}`,
          email: profile.email ?? `strava_${profile.id}@strava.local`,
          image: profile.profile ?? null,
        };
      },
    },
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Hanya simpan data minimal ke JWT — tidak ada DB call
      if (account && profile) {
        token.stravaId = String((profile as { id: string | number }).id);
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        token.scope = account.scope;
        token.needsDbSync = true; // flag untuk sync ke DB setelah login
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub ?? "";
      (session.user as { stravaId?: string; needsDbSync?: boolean }).stravaId =
        token.stravaId as string;
      (session.user as { needsDbSync?: boolean }).needsDbSync =
        (token.needsDbSync as boolean) ?? false;
      return session;
    },
  },
});
