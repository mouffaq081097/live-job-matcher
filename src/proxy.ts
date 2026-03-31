import { withAuth } from "next-auth/middleware";

export const config = { matcher: ["/cv-builder/:path*", "/optimize/:path*", "/jobs/:path*"] };

export default withAuth({
  pages: { signIn: "/sign-in" },
});

