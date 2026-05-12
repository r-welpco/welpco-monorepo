"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { Button } from "@welpco/ui/button";
import { Card } from "@welpco/ui/card";
import { Flex } from "@welpco/ui/flex";
import { Text } from "@welpco/ui/text";
import { Box } from "@welpco/ui/box";
import { Heading } from "@welpco/ui/heading";
import { Link } from "@welpco/ui/link";
import { TextField } from "@welpco/ui/text-field";

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        setIsLoading(false);
        return;
      }

      if (result?.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setIsLoading(false);
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <Card size="4">
      <Heading as="h3" size="6" trim="start" mb="5">
        Sign in
      </Heading>

      {error && (
        <Box mb="5" p="3" style={{ backgroundColor: "var(--red-2)", border: "1px solid var(--red-6)", borderRadius: "var(--radius-3)" }}>
          <Text size="2" color="red">{error}</Text>
        </Box>
      )}

      <Box mb="5">
        <Flex mb="1">
          <Text
            as="label"
            htmlFor="email-field"
            size="2"
            weight="bold"
          >
            Email address
          </Text>
        </Flex>
        <TextField.Root
          id="email-field"
          placeholder="Enter your email"
          type="email"
          {...register("email")}
        />
        {errors.email && (
          <Text size="1" color="red" mt="1">{errors.email.message}</Text>
        )}
      </Box>

      <Box mb="5" position="relative">
        <Flex align="baseline" justify="between" mb="1">
          <Text
            as="label"
            htmlFor="password-field"
            size="2"
            weight="bold"
          >
            Password
          </Text>
          <Link
            href="/forgot-password"
            size="2"
          >
            Forgot password?
          </Link>
        </Flex>
        <TextField.Root
          id="password-field"
          placeholder="Enter your password"
          type="password"
          {...register("password")}
        />
        {errors.password && (
          <Text size="1" color="red" mt="1">{errors.password.message}</Text>
        )}
      </Box>

      <Flex mt="6" justify="end" gap="3">
        <Button variant="outline" onClick={() => router.push("/register")}>
          Create an account
        </Button>
        <Button type="submit" onClick={handleSubmit(onSubmit)} disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign in"}
        </Button>
      </Flex>
    </Card>
  );
}

