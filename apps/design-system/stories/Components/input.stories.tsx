import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { useRef, useState } from 'react';
import { Input } from '@welpco/ui/input';
import { Button } from '@welpco/ui/button';
import { Flex } from '@welpco/ui/flex';

const meta = {
  title: 'Components/Input',
  component: Input,
  args: { label: 'Password', type: 'password', name: 'password', required: true, autoComplete: 'current-password' },
  render: (args) => {
    const input = useRef<HTMLInputElement>(null);
    const [submitted, setSubmitted] = useState('');
    return (
      <Flex asChild direction="column" gap="3" maxWidth="400px">
        <form onSubmit={(event) => { event.preventDefault(); setSubmitted(input.current?.value ?? ''); }}>
          <Input {...args} ref={input} />
          <Button type="submit">Submit</Button>
          <output aria-label="Submitted value">{submitted}</output>
        </form>
      </Flex>
    );
  },
} satisfies Meta<typeof Input>;
export default meta;
type Story = StoryObj<typeof meta>;

export const PasswordRevealAndSubmit: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText(/^Password/, { selector: 'input' });
    await userEvent.type(input, 'Test-password-42');
    await userEvent.click(canvas.getByRole('button', { name: 'Show password' }));
    await expect(input).toHaveAttribute('type', 'text');
    await expect(input).toHaveValue('Test-password-42');
    await expect(input).toHaveAttribute('autocomplete', 'current-password');
    await expect(canvas.getByLabelText('Submitted value')).toHaveTextContent('');
    await userEvent.click(canvas.getByRole('button', { name: 'Hide password' }));
    await expect(input).toHaveAttribute('type', 'password');
    await userEvent.click(canvas.getByRole('button', { name: 'Submit' }));
    await expect(canvas.getByLabelText('Submitted value')).toHaveTextContent('Test-password-42');
  },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 'saved-password' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Show password' })).toBeDisabled();
    await expect(canvas.getByLabelText(/^Password/, { selector: 'input' })).toBeDisabled();
  },
};

export const Error: Story = {
  args: { type: 'email', label: 'Email', error: 'Enter a valid email address.' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('textbox')).toHaveAccessibleDescription('Enter a valid email address.');
    await expect(canvas.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  },
};
