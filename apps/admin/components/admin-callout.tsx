import { Callout } from "@welpco/ui";

export function AdminErrorCallout({ message }: { message: string }) {
  return (
    <Callout.Root color="red" role="alert" mb="3">
      <Callout.Text>{message}</Callout.Text>
    </Callout.Root>
  );
}

export function AdminSuccessCallout({ message }: { message: string }) {
  return (
    <Callout.Root color="green" mb="3">
      <Callout.Text>{message}</Callout.Text>
    </Callout.Root>
  );
}
