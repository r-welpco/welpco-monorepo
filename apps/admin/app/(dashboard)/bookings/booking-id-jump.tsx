"use client";

import { Button, Flex, Text } from "@welpco/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { NativeFormField, nativeInputProps } from "@/components/native-form-field";

export function BookingIdJump() {
  const router = useRouter();
  const [id, setId] = useState("");
  const [err, setErr] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const t = id.trim();
    if (!t) {
      setErr("Enter a booking UUID.");
      return;
    }
    router.push(`/bookings/${t}`);
  }

  return (
    <form onSubmit={onSubmit}>
      <Flex gap="4" wrap="wrap" align="end">
        <NativeFormField label="Open by booking ID">
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="UUID"
            autoComplete="off"
            {...nativeInputProps()}
          />
        </NativeFormField>
        <Button type="submit" size="1" variant="soft">
          Go
        </Button>
        {err ? (
          <Text size="1" color="red" style={{ flexBasis: "100%" }}>
            {err}
          </Text>
        ) : null}
      </Flex>
    </form>
  );
}
