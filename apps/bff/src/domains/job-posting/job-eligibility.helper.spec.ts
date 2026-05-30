import {
  JobPostingStatus,
  JOB_POSTING_MAX_APPLICATIONS,
} from './entities';
import { JobPosting } from './entities/job-posting.entity';
import {
  offeringMatchesSubcategory,
  resolveApplyBlockReason,
  resolveMatchingOfferings,
} from './job-eligibility.helper';
import { ServiceOffering } from '../profile-management/entities/service-offering.entity';

function makeJob(overrides: Partial<JobPosting> = {}): JobPosting {
  return {
    id: 'job-1',
    customerId: 'cust-1',
    categoryId: 'cat-1',
    subcategoryId: 'sub-1',
    serviceQuestionCategoryId: 'sub-1',
    answers: {},
    title: 'Test',
    description: 'Desc',
    scheduledDate: '2026-06-01',
    scheduledStartTime: '09:00',
    scheduledEndTime: '11:00',
    durationMinutes: 120,
    locationAddress: '123 Main',
    locationLat: null,
    locationLng: null,
    locationCity: 'Montreal',
    locationRegion: 'QC',
    status: JobPostingStatus.PUBLISHED,
    applicationCount: 0,
    maxApplications: JOB_POSTING_MAX_APPLICATIONS,
    expiresAt: new Date(Date.now() + 86400000),
    bookingId: null,
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as JobPosting;
}

function makeOffering(subcategoryIds: string[], active = true): ServiceOffering {
  return {
    id: 'off-1',
    welperId: 'welper-1',
    serviceCategoryId: 'cat-1',
    serviceDescription: 'Cleaning',
    hourlyRate: 50,
    experienceYears: 2,
    serviceArea: null,
    subcategoryIds,
    active,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as ServiceOffering;
}

describe('job-eligibility.helper', () => {
  describe('offeringMatchesSubcategory', () => {
    it('matches when subcategory is in offering.subcategoryIds', () => {
      expect(offeringMatchesSubcategory(makeOffering(['sub-1']), 'sub-1')).toBe(true);
    });

    it('does not match parent category when only subcategory is required', () => {
      expect(offeringMatchesSubcategory(makeOffering(['cat-1']), 'sub-1')).toBe(false);
    });

    it('rejects inactive offerings', () => {
      expect(offeringMatchesSubcategory(makeOffering(['sub-1'], false), 'sub-1')).toBe(false);
    });
  });

  describe('resolveApplyBlockReason', () => {
    it('returns NOT_DISCOVERABLE when welper is not discoverable', () => {
      const reason = resolveApplyBlockReason({
        job: makeJob(),
        discoverable: false,
        matchingOfferings: [makeOffering(['sub-1'])],
        existingApplication: false,
      });
      expect(reason).toBe('NOT_DISCOVERABLE');
    });

    it('returns NO_MATCHING_OFFERING when no offering matches subcategory', () => {
      const reason = resolveApplyBlockReason({
        job: makeJob(),
        discoverable: true,
        matchingOfferings: [],
        existingApplication: false,
      });
      expect(reason).toBe('NO_MATCHING_OFFERING');
    });

    it('returns null when welper can apply', () => {
      const reason = resolveApplyBlockReason({
        job: makeJob(),
        discoverable: true,
        matchingOfferings: [makeOffering(['sub-1'])],
        existingApplication: false,
      });
      expect(reason).toBeNull();
    });

    it('returns JOB_EXPIRED for expired jobs', () => {
      const reason = resolveApplyBlockReason({
        job: makeJob({ status: JobPostingStatus.EXPIRED }),
        discoverable: true,
        matchingOfferings: [makeOffering(['sub-1'])],
        existingApplication: false,
      });
      expect(reason).toBe('JOB_EXPIRED');
    });
  });

  describe('resolveMatchingOfferings', () => {
    it('filters to active offerings with matching subcategory', () => {
      const offerings = [
        makeOffering(['sub-1']),
        makeOffering(['sub-2']),
        makeOffering(['sub-1'], false),
      ];
      const result = resolveMatchingOfferings(offerings, 'sub-1');
      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe('off-1');
    });
  });
});
