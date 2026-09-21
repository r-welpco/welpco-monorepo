import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { useState } from 'react';
import { LabeledSlider } from '@welpco/ui/slider';
import { Box } from '@welpco/ui/box';

const meta = {
  title: 'Components/LabeledSlider',
  component: LabeledSlider,
  args: { thumbLabels: ['Search radius'], defaultValue: [25], min: 5, max: 100, step: 5 },
  decorators: [(Story) => <Box p="4" maxWidth="400px"><Story /></Box>],
} satisfies Meta<typeof LabeledSlider>;
export default meta;
type Story = StoryObj<typeof meta>;

export const KeyboardAndCommit: Story = {
  args: { onValueChange: fn(), onValueCommit: fn(), getValueText: (value) => `${value} km` },
  play: async ({ canvasElement, args }) => {
    const thumb = within(canvasElement).getByRole('slider', { name: 'Search radius' });
    thumb.focus();
    await waitFor(() => expect(thumb).toHaveFocus());
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(thumb).toHaveAttribute('aria-valuenow', '30'));
    await waitFor(() => expect(thumb).toHaveAttribute('aria-valuetext', '30 km'));
    await expect(args.onValueChange).toHaveBeenCalledWith([30]);
    await expect(args.onValueCommit).toHaveBeenCalledWith([30]);
    await userEvent.keyboard('{End}{ArrowRight}');
    await waitFor(() => expect(thumb).toHaveAttribute('aria-valuenow', '100'));
    await userEvent.keyboard('{Home}{ArrowLeft}');
    await waitFor(() => expect(thumb).toHaveAttribute('aria-valuenow', '5'));
  },
};

export const ControlledRange: Story = {
  args: { thumbLabels: ['Prix minimum', 'Prix maximum'], defaultValue: [50, 100], min: 0, max: 200 },
  render: (args) => {
    const [value, setValue] = useState(args.defaultValue);
    return <LabeledSlider {...args} value={value} onValueChange={setValue} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole('slider', { name: 'Prix minimum' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(canvas.getByRole('slider', { name: 'Prix minimum' })).toHaveAttribute('aria-valuenow', '55'));
    await expect(canvas.getByRole('slider', { name: 'Prix maximum' })).toHaveAttribute('aria-valuenow', '100');
  },
};

export const Disabled: Story = { args: { disabled: true } };

/** The browser matrix drives a real pointer drag and verifies one release commit. */
export const PointerCommit: Story = {
  render: (args) => {
    const [value, setValue] = useState([25]);
    const [commits, setCommits] = useState(0);
    return <>
      <LabeledSlider {...args} value={value} onValueChange={setValue}
        onValueCommit={() => setCommits((count) => count + 1)} />
      <output aria-label="Slider value">{value[0]}</output>
      <output aria-label="Commit count">{commits}</output>
    </>;
  },
};
