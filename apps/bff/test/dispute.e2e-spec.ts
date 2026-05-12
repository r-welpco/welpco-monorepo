/**
 * Real DB + HTTP integration tests for dispute filing, resolution, and booking state.
 *
 * Requires PostgreSQL with migrations applied and seed users (customer@welpco.com,
 * welper@welpco.com, admin@welpco.local). Skipped unless RUN_DISPUTE_E2E=1.
 *
 * Run: `RUN_DISPUTE_E2E=1 pnpm --filter @welpco/bff exec jest test/dispute.e2e-spec.ts`
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { BookingRequest, BookingRequestStatus } from '../src/domains/booking/entities/booking-request.entity';
import { UserAccount } from '../src/domains/user-management/entities/user-account.entity';

const runDisputeE2e = process.env.RUN_DISPUTE_E2E === '1';

(runDisputeE2e ? describe : describe.skip)('BFF Dispute flow (e2e, real DB)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;

  async function createInProgressBooking(): Promise<string> {
    const userRepo = dataSource.getRepository(UserAccount);
    const cust = await userRepo.findOne({ where: { email: 'customer@welpco.com' } });
    const welp = await userRepo.findOne({ where: { email: 'welper@welpco.com' } });
    if (!cust || !welp) {
      throw new Error('Expected seed users customer@welpco.com and welper@welpco.com');
    }
    const rows = await dataSource.query(
      'SELECT id FROM service_offerings WHERE welper_id = $1 LIMIT 1',
      [welp.id],
    );
    if (!rows?.length) {
      throw new Error('No service_offering for seed welper; run pnpm seed:users');
    }
    const bookingRepo = dataSource.getRepository(BookingRequest);
    const saved = await bookingRepo.save(
      bookingRepo.create({
        customerId: cust.id,
        welperId: welp.id,
        serviceOfferingId: rows[0].id,
        status: BookingRequestStatus.IN_PROGRESS,
        answers: {},
      }),
    );
    return saved.id;
  }

  async function cleanupBooking(bookingId: string): Promise<void> {
    await dataSource.query('DELETE FROM resolutions WHERE dispute_id IN (SELECT id FROM disputes WHERE booking_id = $1)', [
      bookingId,
    ]);
    await dataSource.query('DELETE FROM disputes WHERE booking_id = $1', [bookingId]);
    await dataSource.getRepository(BookingRequest).delete(bookingId);
  }

  function bearerForUser(user: UserAccount, accountType: string): string {
    return jwtService.sign({
      sub: user.id,
      email: user.email,
      accountType,
    });
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    dataSource = app.get(DataSource);
    jwtService = app.get(JwtService);
  }, 60_000);

  afterAll(async () => {
    if (app) await app.close();
  });

  it('welper cannot check out a disputed booking (must use support resolution)', async () => {
    const bookingId = await createInProgressBooking();
    const userRepo = dataSource.getRepository(UserAccount);
    const cust = (await userRepo.findOne({ where: { email: 'customer@welpco.com' } }))!;
    const welp = (await userRepo.findOne({ where: { email: 'welper@welpco.com' } }))!;

    const custToken = bearerForUser(cust, 'Customer');
    const welpToken = bearerForUser(welp, 'Welper');

    const disputeRes = await request(app.getHttpServer())
      .post(`/api/bookings/${bookingId}/disputes`)
      .set('Authorization', `Bearer ${custToken}`)
      .send({
        subject: 'Quality issue after visit',
        category: 'quality',
        description: 'Service did not meet expectations',
      })
      .expect(201);

    expect(disputeRes.body.status).toBe('open');

    await request(app.getHttpServer())
      .patch(`/api/bookings/${bookingId}/check-out`)
      .set('Authorization', `Bearer ${welpToken}`)
      .expect(400);

    await cleanupBooking(bookingId);
  });

  it('customer gets 403 on resolution; admin resolves and booking becomes completed', async () => {
    const bookingId = await createInProgressBooking();
    const userRepo = dataSource.getRepository(UserAccount);
    const cust = (await userRepo.findOne({ where: { email: 'customer@welpco.com' } }))!;
    const admin = (await userRepo.findOne({ where: { email: 'admin@welpco.local' } }))!;

    const custToken = bearerForUser(cust, 'Customer');
    const adminToken = bearerForUser(admin, 'Admin');

    const disputeRes = await request(app.getHttpServer())
      .post(`/api/bookings/${bookingId}/disputes`)
      .set('Authorization', `Bearer ${custToken}`)
      .send({
        subject: 'Billing disagreement',
        category: 'overcharge',
        description: 'Charged more than quoted',
      })
      .expect(201);

    const disputeId = disputeRes.body.id as string;

    await request(app.getHttpServer())
      .post(`/api/disputes/${disputeId}/resolution`)
      .set('Authorization', `Bearer ${custToken}`)
      .send({ resolutionType: 'no_action' })
      .expect(403);

    const resolutionRes = await request(app.getHttpServer())
      .post(`/api/disputes/${disputeId}/resolution`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ resolutionType: 'no_action' })
      .expect(201);

    expect(resolutionRes.body.bookingId).toBe(bookingId);
    expect(resolutionRes.body.bookingStatus).toBe('completed');

    const getBooking = await request(app.getHttpServer())
      .get(`/api/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${custToken}`)
      .expect(200);

    expect(getBooking.body.status).toBe('completed');

    await cleanupBooking(bookingId);
  });
});
