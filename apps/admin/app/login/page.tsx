import { Flex } from "@welpco/ui";
import { LoginForm } from "./login-form";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <Flex align="center" justify="center" minHeight="100vh" p="5">
      <LoginForm searchParams={searchParams} />
    </Flex>
  );
}
