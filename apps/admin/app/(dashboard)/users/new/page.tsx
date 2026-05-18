"use client";

import { Button, Card, Flex, Heading, Text } from "@welpco/ui";
import { Input } from "@welpco/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminErrorCallout } from "@/components/admin-callout";
import { createAdminUser } from "@/lib/services/admin-users-service";

export default function CreateAdminUserPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const user = await createAdminUser(email, password);
      router.push(`/users/${user.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create admin user");
      setLoading(false);
    }
  }

  return (
    <Flex direction="column" gap="4">
      <Text size="2">
        <Link href="/users">← Users</Link>
      </Text>
      <Heading size="6">Create admin user</Heading>
      <Card size="2" style={{ maxWidth: 480 }}>
        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="off"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <Input
              label="Confirm password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
            {error ? <AdminErrorCallout message={error} /> : null}
            <Button type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create admin account"}
            </Button>
          </Flex>
        </form>
      </Card>
    </Flex>
  );
}
