"use client";

import { Button, Card, Flex, Heading, Text } from "@welpco/ui";
import { Input } from "@welpco/ui/input";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { AdminErrorCallout } from "@/components/admin-callout";

export function LoginForm({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = use(searchParams);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(() => {
    if (params.error === "Forbidden") return "Admin access only.";
    if (params.error === "AccountInactive") return "This admin account is not active.";
    return null;
  });
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });
      if (res?.error || !res?.ok) {
        setError("Invalid email or password, or account is not an administrator.");
        setLoading(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card size="3" style={{ width: "100%", maxWidth: 400 }}>
      <Flex direction="column" gap="4">
        <Flex direction="column" gap="1">
          <Heading size="5">Staff sign in</Heading>
          <Text size="2" color="gray">
            Welpco platform administrators only.
          </Text>
        </Flex>
        <form onSubmit={onSubmit}>
          <Flex direction="column" gap="3">
            <Input
              label="Email"
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error ? <AdminErrorCallout message={error} /> : null}
            <Button type="submit" loading={loading} style={{ width: "100%" }}>
              Sign in
            </Button>
          </Flex>
        </form>
      </Flex>
    </Card>
  );
}
