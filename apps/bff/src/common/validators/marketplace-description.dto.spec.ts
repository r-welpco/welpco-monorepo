import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { CreateJobPostingDto } from '../../domains/job-posting/dto/create-job-posting.dto';
import { CreateJobApplicationDto } from '../../domains/job-posting/dto/create-job-application.dto';
import { CreateServiceOfferingDto } from '../../domains/profile-management/service-offering/dto/create-service-offering.dto';
import { UpdateServiceOfferingDto } from '../../domains/profile-management/service-offering/dto/update-service-offering.dto';
import { CreateWelperProfileDto } from '../../domains/profile-management/welper-profile/dto/create-welper-profile.dto';
import { UpdateWelperProfileDto } from '../../domains/profile-management/welper-profile/dto/update-welper-profile.dto';
import { WelperBioStepDto } from '../../modules/auth/dto/welper-bio-step.dto';
import { WelperOfferingStepDto } from '../../modules/auth/dto/welper-offering-step.dto';
import { UpdateMyProfileDto } from '../../modules/profiles/dto/update-my-profile.dto';
import {
  CreatePortfolioPhotoDto,
  UpdatePortfolioPhotoDto,
} from '../../domains/profile-management/sharing/dto/portfolio-photo.dto';
import {
  collectMarketplaceDescriptionPolicyError,
  MARKETPLACE_DESCRIPTION_CONSTRAINT,
} from './marketplace-description.validator';

function hasPolicyError(errors: ValidationError[]): boolean {
  return errors.some(
    (error) =>
      Boolean(error.constraints?.[MARKETPLACE_DESCRIPTION_CONSTRAINT]) ||
      hasPolicyError(error.children ?? []),
  );
}

describe('marketplace description DTO coverage', () => {
  const cases: Array<[string, new () => object, Record<string, unknown>]> = [
    [
      'job posting',
      CreateJobPostingDto,
      { description: 'name at gmail dot com' },
    ],
    [
      'job title',
      CreateJobPostingDto,
      { title: 'name at gmail dot com' },
    ],
    [
      'job service-question answers',
      CreateJobPostingDto,
      { answers: { questionId: 'name at gmail dot com' } },
    ],
    [
      'job application proposal',
      CreateJobApplicationDto,
      { proposalMessage: 'name at gmail dot com' },
    ],
    [
      'service offering create',
      CreateServiceOfferingDto,
      { serviceDescription: 'name at gmail dot com' },
    ],
    [
      'service offering update',
      UpdateServiceOfferingDto,
      { serviceDescription: 'name at gmail dot com' },
    ],
    ['signup bio', WelperBioStepDto, { bio: 'name at gmail dot com' }],
    [
      'signup offering',
      WelperOfferingStepDto,
      { offerings: [{ description: 'name at gmail dot com' }] },
    ],
    [
      'signup offering title',
      WelperOfferingStepDto,
      { offerings: [{ title: 'name at gmail dot com' }] },
    ],
    [
      'welper profile create',
      CreateWelperProfileDto,
      { bio: 'name at gmail dot com' },
    ],
    [
      'welper profile update',
      UpdateWelperProfileDto,
      { bio: 'name at gmail dot com' },
    ],
    [
      'dashboard welper profile update',
      UpdateMyProfileDto,
      { bio: 'this is my phone number +1 438 872 8792\nlet negotiate' },
    ],
    [
      'portfolio caption create',
      CreatePortfolioPhotoDto,
      { caption: 'name at gmail dot com' },
    ],
    [
      'portfolio caption update',
      UpdatePortfolioPhotoDto,
      { caption: 'name at gmail dot com' },
    ],
  ];

  it.each(cases)('protects %s descriptions', async (_name, Dto, input) => {
    const errors = await validate(plainToInstance(Dto, input));
    expect(hasPolicyError(errors)).toBe(true);
  });

  it('accepts benign English and French descriptions', async () => {
    const english = plainToInstance(UpdateServiceOfferingDto, {
      serviceDescription: 'Careful home cleaning with eco-friendly products.',
    });
    const french = plainToInstance(UpdateWelperProfileDto, {
      bio: 'Je propose un travail fiable et soigne dans votre quartier.',
    });

    expect(hasPolicyError(await validate(english))).toBe(false);
    expect(hasPolicyError(await validate(french))).toBe(false);
  });

  it('collects nested field paths and deduplicated violation types', async () => {
    const dto = plainToInstance(WelperOfferingStepDto, {
      offerings: [
        { description: 'name at gmail dot com or 416 555 0199' },
        { description: 'The rate is negotiable; call 416 555 0199' },
      ],
    });

    expect(
      collectMarketplaceDescriptionPolicyError(await validate(dto)),
    ).toEqual({
      fields: ['offerings.0.description', 'offerings.1.description'],
      violations: ['email', 'phone', 'negotiation'],
    });
  });

  it('rejects the dashboard bio regression with phone and negotiation violations', async () => {
    const dto = plainToInstance(UpdateMyProfileDto, {
      bio: 'this is my phone number +1 438 872 8792\nlet negotiate',
    });

    expect(
      collectMarketplaceDescriptionPolicyError(await validate(dto)),
    ).toEqual({
      fields: ['bio'],
      violations: ['phone', 'negotiation'],
    });
  });
});
