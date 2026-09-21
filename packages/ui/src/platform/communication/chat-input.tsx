"use client";

import { TextField } from "@welpco/ui/text-field";
import { Button } from "@welpco/ui/button";
import { IconButton } from "@welpco/ui/icon-button";
import { Flex } from "@welpco/ui/flex";
import { Text } from "@welpco/ui/text";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useRef, useState } from "react";
import { Paperclip } from "lucide-react";

/**
 * Message body cap — mirrors `SendMessageDto.@MaxLength(4000)` on the BFF.
 * Hard-defined here so the UI can never silently submit a body the server
 * will reject. Counter only shows once we cross 90% of the cap.
 */
export const CHAT_MESSAGE_MAX_LENGTH = 4000;
const CHAT_MESSAGE_COUNTER_THRESHOLD = Math.floor(
  CHAT_MESSAGE_MAX_LENGTH * 0.9,
);

export interface ChatInputProps {
  placeholder?: string;
  disabled?: boolean;
  /**
   * Disables the input when the underlying message list is still loading the
   * initial page (so users don't send into an unloaded thread). The button
   * copy stays "Send" — only the in-flight send swaps to "Sending…".
   */
  loading?: boolean;
  /** True while the parent's send mutation is in flight. Drives button copy. */
  sending?: boolean;
  onSend?: (message: string) => void | Promise<void>;
  onAttachment?: () => void;
  /** Localized recovery message when onSend throws or rejects. */
  sendErrorMessage?: string;
}

export function ChatInput({
  placeholder = "Type a message...",
  disabled,
  loading,
  sending,
  onSend,
  onAttachment,
  sendErrorMessage = "Message couldn't be sent. Your draft is saved here. Try sending again.",
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [sendFailed, setSendFailed] = useState(false);
  const inFlight = useRef(false);
  const draftRevision = useRef(0);

  const trimmedLength = message.trim().length;
  const overLimit = message.length > CHAT_MESSAGE_MAX_LENGTH;
  const showCounter =
    message.length >= CHAT_MESSAGE_COUNTER_THRESHOLD || overLimit;
  const remaining = CHAT_MESSAGE_MAX_LENGTH - message.length;

  const sendDisabled =
    disabled || loading || sending || pending || !onSend || trimmedLength === 0 || overLimit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sendDisabled || inFlight.current || !onSend) return;
    const submittedRevision = draftRevision.current;
    inFlight.current = true;
    setPending(true);
    setSendFailed(false);
    try {
      await onSend(message.trim());
      if (draftRevision.current === submittedRevision) setMessage("");
    } catch {
      setSendFailed(true);
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Flex direction="column" gap="1">
        <Flex gap="2" align="center">
          {onAttachment && (
            <IconButton
              type="button"
              variant="ghost"
              onClick={onAttachment}
              disabled={disabled || loading || sending || pending}
              aria-label="Attach file"
            >
              <Paperclip size={16} aria-hidden="true" />
            </IconButton>
          )}
          <TextField.Root
            size="2"
            placeholder={placeholder}
            value={message}
            maxLength={CHAT_MESSAGE_MAX_LENGTH}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              draftRevision.current++;
              setMessage(event.currentTarget.value);
            }}
            disabled={disabled || loading}
            aria-label="Message"
            aria-invalid={overLimit ? true : undefined}
            autoComplete="off"
            style={{ flex: 1, minWidth: 0 }}
          />
          <Button
            type="submit"
            size="2"
            color={SEMANTIC_COLOR.primary}
            disabled={sendDisabled}
          >
            {sending || pending ? "Sending..." : "Send"}
          </Button>
        </Flex>
        {sendFailed && (
          <Text size="1" color={SEMANTIC_COLOR.danger} role="alert">
            {sendErrorMessage}
          </Text>
        )}
        {showCounter && (
          <Text
            size="1"
            color={overLimit ? SEMANTIC_COLOR.danger : "gray"}
            highContrast={!overLimit}
            role={overLimit ? "alert" : undefined}
            aria-live={overLimit ? "polite" : undefined}
            mr="1"
            style={{ alignSelf: "flex-end" }}
          >
            {overLimit
              ? `Message is too long — trim ${message.length - CHAT_MESSAGE_MAX_LENGTH} characters`
              : `${remaining} characters left`}
          </Text>
        )}
      </Flex>
    </form>
  );
}

