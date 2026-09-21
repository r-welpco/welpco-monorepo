import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { useRef, useState } from 'react';
import { ChatInput } from '@welpco/ui';
import { Button } from '@welpco/ui/button';
import { Flex } from '@welpco/ui/flex';

const meta = { title: 'Platform/Communication/ChatInputInteractions', component: ChatInput } satisfies Meta<typeof ChatInput>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
  args: { onSend: fn(async () => {}) },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole('textbox'), '  Hello  ');
    await userEvent.click(canvas.getByRole('button', { name: 'Send' }));
    await expect(args.onSend).toHaveBeenCalledTimes(1);
    await expect(args.onSend).toHaveBeenCalledWith('Hello');
    await expect(canvas.getByRole('textbox')).toHaveValue('');
  },
};

export const RejectedSendAndRetry: Story = {
  render: (args) => {
    const attempts = useRef(0);
    return <ChatInput {...args} onSend={async (message) => {
      args.onSend?.(message);
      if (++attempts.current === 1) throw new Error('Offline');
    }} />;
  },
  args: {
    onSend: fn(),
    sendErrorMessage: 'Envoi impossible. Votre brouillon est conservé. Réessayez.',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole('textbox'), 'Bonjour');
    await userEvent.click(canvas.getByRole('button', { name: 'Send' }));
    await expect(await canvas.findByRole('alert')).toHaveTextContent('Votre brouillon est conservé');
    await expect(canvas.getByRole('textbox')).toHaveValue('Bonjour');
    await expect(args.onSend).toHaveBeenCalledTimes(1);
    await userEvent.click(canvas.getByRole('button', { name: 'Send' }));
    await expect(args.onSend).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(canvas.getByRole('textbox')).toHaveValue(''));
    await expect(canvas.queryByRole('alert')).not.toBeInTheDocument();
  },
};

export const SynchronousFailure: Story = {
  args: { onSend: fn(() => { throw new Error('Offline'); }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole('textbox'), 'Keep this draft');
    await userEvent.click(canvas.getByRole('button', { name: 'Send' }));
    await expect(await canvas.findByRole('alert')).toBeVisible();
    await expect(canvas.getByRole('textbox')).toHaveValue('Keep this draft');
  },
};

export const PendingEditAndDoubleSubmit: Story = {
  render: () => {
    const resolve = useRef<(() => void) | undefined>(undefined);
    const [calls, setCalls] = useState(0);
    return (
      <Flex direction="column" gap="3" maxWidth="500px">
        <ChatInput onSend={() => {
          setCalls((value) => value + 1);
          return new Promise<void>((done) => { resolve.current = done; });
        }} />
        <Button onClick={() => resolve.current?.()}>Complete request</Button>
        <output aria-label="Send count">{calls}</output>
      </Flex>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox');
    await userEvent.type(input, 'First draft');
    const form = input.closest('form')!;
    form.requestSubmit();
    form.requestSubmit();
    await waitFor(() => expect(canvas.getByLabelText('Send count')).toHaveTextContent('1'));
    await expect(input).toHaveValue('First draft');
    await expect(canvas.getByRole('button', { name: 'Sending...' })).toBeDisabled();
    await userEvent.clear(input);
    await userEvent.type(input, 'A newer draft');
    await userEvent.click(canvas.getByRole('button', { name: 'Complete request' }));
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Send' })).toBeEnabled());
    await expect(input).toHaveValue('A newer draft');
    await expect(canvas.getByLabelText('Send count')).toHaveTextContent('1');
  },
};

export const MissingHandler: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole('textbox'), 'Unsent draft');
    canvas.getByRole('textbox').closest('form')!.requestSubmit();
    await expect(canvas.getByRole('textbox')).toHaveValue('Unsent draft');
    await expect(canvas.getByRole('button', { name: 'Send' })).toBeDisabled();
  },
};

export const ExternalSending: Story = { args: { sending: true, onSend: fn() } };
