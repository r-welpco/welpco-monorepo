import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { ProfilePhotoCropDialog } from '../../../../../packages/ui/src/platform/profile-management/profile-photo-crop-dialog';

const meta = {
  title: 'Platform/ProfileManagement/ProfilePhotoCropDialog',
  component: ProfilePhotoCropDialog,
  args: {
    open: true,
    imageSrc: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#d3e8dc"/><circle cx="200" cy="200" r="100" fill="#2f5d44"/></svg>')}`,
    labels: { title: 'Recadrer votre photo de profil', description: 'Déplacez la photo et ajustez le zoom avant de confirmer.', zoom: 'Agrandissement de la photo', cancel: 'Annuler', save: 'Enregistrer la photo' },
    onOpenChange: fn(), onConfirm: fn(),
  },
} satisfies Meta<typeof ProfilePhotoCropDialog>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ZoomAndConfirm: Story = {
  play: async ({ canvasElement, args }) => {
    const screen = within(canvasElement.ownerDocument.body);
    const thumb = screen.getByRole('slider', { name: args.labels.zoom });
    thumb.focus();
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(thumb).toHaveAttribute('aria-valuenow', '1.05'));
    const save = screen.getByRole('button', { name: args.labels.save });
    await waitFor(() => expect(save).toBeEnabled());
    await userEvent.click(save);
    await expect(args.onConfirm).toHaveBeenCalledTimes(1);
    await expect(args.onConfirm).toHaveBeenCalledWith(expect.objectContaining({ width: expect.any(Number), height: expect.any(Number) }));
  },
};

export const PendingDismissalGuard: Story = {
  args: { loading: true },
  play: async ({ canvasElement, args }) => {
    const screen = within(canvasElement.ownerDocument.body);
    await expect(screen.getByRole('slider')).toHaveAttribute('data-disabled');
    await userEvent.keyboard('{Escape}');
    await userEvent.click(screen.getAllByRole('button', { name: args.labels.cancel })[0]!);
    await expect(args.onOpenChange).not.toHaveBeenCalled();
    await expect(screen.getByRole('dialog', { name: args.labels.title })).toBeVisible();
  },
};
