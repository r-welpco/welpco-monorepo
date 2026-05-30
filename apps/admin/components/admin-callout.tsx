"use client";

import { Callout } from "@welpco/ui";

export function AdminErrorCallout({ message }: { message: React.ReactNode }) {
  return (
    <Callout.Root color="red" role="alert" mb="3">
      <Callout.Text>{message}</Callout.Text>
    </Callout.Root>
  );
}

export function AdminSuccessCallout({ message }: { message: React.ReactNode }) {
  return (
    <Callout.Root color="green" mb="3">
      <Callout.Text>{message}</Callout.Text>
    </Callout.Root>
  );
}

export function AdminWarningCallout({ message }: { message: React.ReactNode }) {
  return (
    <Callout.Root color="amber" mb="3">
      <Callout.Text>{message}</Callout.Text>
    </Callout.Root>
  );
}

export function AdminInfoCallout({ message }: { message: React.ReactNode }) {
  return (
    <Callout.Root color="blue" mb="3">
      <Callout.Text>{message}</Callout.Text>
    </Callout.Root>
  );
}
