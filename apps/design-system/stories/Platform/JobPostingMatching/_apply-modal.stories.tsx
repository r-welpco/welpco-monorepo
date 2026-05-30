import type { Meta, StoryObj } from '@storybook/react-vite';
import { Fragment } from 'react';
import { Card } from '@welpco/ui/card';
import { Flex } from '@welpco/ui/flex';
import { Box } from '@welpco/ui/box';
import { Text } from '@welpco/ui/text';
import { Heading } from '@welpco/ui/heading';
import { Button } from '@welpco/ui/button';
import { Separator } from '@welpco/ui/separator';
import { SEMANTIC_COLOR } from '@welpco/ui/tokens';
import { JobApplicationForm } from '@welpco/ui';
import { ArrowLeft, Check } from 'lucide-react';

const STEPS = [
  { key: 'review', label: 'Review job' },
  { key: 'submit', label: 'Your proposal' },
] as const;

function ApplyStepper({ activeIndex }: { activeIndex: number }) {
  const primary = SEMANTIC_COLOR.primary;
  return (
    <Flex align="center" gap="2">
      {STEPS.map((step, i) => {
        const isActive = i === activeIndex;
        const isDone = i < activeIndex;
        const accent = isActive || isDone;
        return (
          <Fragment key={step.key}>
            <Flex
              align="center"
              gap="2"
              px="3"
              py="1"
              style={{
                borderRadius: '9999px',
                backgroundColor: accent ? `var(--${primary}-3)` : 'var(--gray-3)',
                border: accent ? `1px solid var(--${primary}-6)` : '1px solid var(--gray-5)',
                color: accent ? `var(--${primary}-11)` : 'var(--gray-11)',
              }}
            >
              {isDone ? <Check size={14} aria-hidden /> : <Text size="1" weight="bold">{i + 1}</Text>}
              <Text size="2" weight={isActive ? 'bold' : 'medium'}>
                {step.label}
              </Text>
            </Flex>
            {i < STEPS.length - 1 && (
              <Box style={{ flex: 1, height: '1px', backgroundColor: 'var(--gray-5)' }} />
            )}
          </Fragment>
        );
      })}
    </Flex>
  );
}

function ModalShell({ activeIndex }: { activeIndex: number }) {
  return (
    <Box style={{ width: '600px' }}>
      <Card size="4" variant="surface">
        <Flex direction="column" gap="4">
          <Box>
            <Heading size="5" trim="start">
              Apply to this job
            </Heading>
            <Text size="2" color="gray" mt="2">
              {activeIndex === 0
                ? "Check the job details and the customer's answers before you write your proposal."
                : "Pick the offering you'll deliver this with and introduce yourself to the customer."}
            </Text>
          </Box>

          <ApplyStepper activeIndex={activeIndex} />

          <Box pr="2" style={{ maxHeight: '56vh', overflowY: 'auto' }}>
            <JobApplicationForm
              embedded
              formId="welper-apply-form"
              hideSubmit
              matchingOfferings={[
                { id: '1', hourlyRate: 45, serviceDescription: 'General moving help and heavy lifting' },
                { id: '2', hourlyRate: 60, serviceDescription: 'Furniture assembly and careful packing' },
              ]}
            />
          </Box>

          <Separator size="4" />

          <Flex justify="between" align="center" gap="3">
            <Button variant="ghost" color="gray">
              <ArrowLeft size={16} aria-hidden />
              Back
            </Button>
            <Button type="submit" form="welper-apply-form" color={SEMANTIC_COLOR.primary}>
              Submit application
            </Button>
          </Flex>
        </Flex>
      </Card>
    </Box>
  );
}

const meta = {
  title: 'Platform/JobPostingMatching/_ApplyModal',
  component: ModalShell,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ModalShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ProposalStep: Story = { args: { activeIndex: 1 } };
