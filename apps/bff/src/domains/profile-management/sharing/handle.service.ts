import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WelperProfile } from '../entities/welper-profile.entity';
import { HANDLE_REGEX, RESERVED_HANDLES } from './handle.constants';
import { ClaimHandleResponseDto } from './dto';

/** Postgres unique-violation SQLSTATE — the claim race falls back on this. */
const PG_UNIQUE_VIOLATION = '23505';

/**
 * SHARE-002 (BFF): vanity-handle claim + resolve.
 *
 * Handles are set-once (rename policy is an open product decision — plan §7),
 * lowercase, regex + reserved-word validated. Uniqueness is enforced twice:
 * a pre-check for a friendly 409, and the DB unique index for the race.
 */
@Injectable()
export class HandleService {
  constructor(
    @InjectRepository(WelperProfile)
    private readonly welperProfileRepo: Repository<WelperProfile>,
  ) {}

  /** Normalize + validate a raw handle; throws typed errors. Exposed for specs. */
  normalizeAndValidate(raw: string): string {
    const handle = raw.trim().toLowerCase();
    if (!HANDLE_REGEX.test(handle)) {
      throw new BadRequestException({
        code: 'INVALID_HANDLE',
        message:
          'Handles are 3–30 characters: lowercase letters, digits and hyphens, starting with a letter or digit.',
      });
    }
    if (RESERVED_HANDLES.has(handle)) {
      throw new ConflictException({
        code: 'HANDLE_RESERVED',
        message: 'This handle is reserved and cannot be claimed.',
      });
    }
    return handle;
  }

  async claimHandle(welperId: string, rawHandle: string): Promise<ClaimHandleResponseDto> {
    const handle = this.normalizeAndValidate(rawHandle);

    const profile = await this.welperProfileRepo.findOne({ where: { welperId } });
    if (!profile) {
      throw new NotFoundException('Welper profile not found');
    }
    if (profile.handle) {
      throw new ConflictException({
        code: 'HANDLE_ALREADY_SET',
        message: `Your handle is already set to "${profile.handle}" and cannot be changed.`,
      });
    }

    const taken = await this.welperProfileRepo.findOne({ where: { handle } });
    if (taken) {
      throw new ConflictException({
        code: 'HANDLE_TAKEN',
        message: 'This handle is already claimed.',
      });
    }

    profile.handle = handle;
    try {
      await this.welperProfileRepo.save(profile);
    } catch (err) {
      // Race between the pre-check and the save — the unique index wins.
      if ((err as { code?: string })?.code === PG_UNIQUE_VIOLATION) {
        throw new ConflictException({
          code: 'HANDLE_TAKEN',
          message: 'This handle is already claimed.',
        });
      }
      throw err;
    }

    return { handle };
  }

  /**
   * Resolve a handle to a welper id. Returns null (callers map to 404) when
   * unknown — visibility gating happens in the public-profile read itself.
   */
  async resolveHandleToWelperId(rawHandle: string): Promise<string | null> {
    const handle = rawHandle.trim().toLowerCase();
    if (!HANDLE_REGEX.test(handle)) return null;
    const profile = await this.welperProfileRepo.findOne({
      where: { handle },
      select: ['welperId'],
    });
    return profile?.welperId ?? null;
  }
}
