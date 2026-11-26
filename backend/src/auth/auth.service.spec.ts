import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { User, UserRole } from '../entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  const repo = {
    findOne: jest.fn(),
    create: jest.fn((u: Partial<User>) => u),
    save: jest.fn((u: Partial<User>) => Promise.resolve({ id: 'u1', ...u })),
    createQueryBuilder: jest.fn(),
  };
  const jwt = { sign: jest.fn(() => 'signed-token') };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: repo },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  const mockLookup = (user: Partial<User> | null) =>
    repo.createQueryBuilder.mockReturnValue({
      addSelect: () => ({ where: () => ({ getOne: () => user }) }),
    });

  describe('register', () => {
    const dto = {
      email: 'New@Example.com',
      password: 'secret1',
      firstName: 'A',
      lastName: 'B',
    };

    it('hashes the password, lowercases the email, defaults to student', async () => {
      repo.findOne.mockResolvedValue(null);
      const res = await service.register(dto);

      const saved = repo.save.mock.calls[0][0] as User;
      expect(saved.password).not.toBe('secret1');
      expect(await bcrypt.compare('secret1', saved.password)).toBe(true);
      expect(saved.email).toBe('new@example.com');
      expect(res.role).toBe(UserRole.STUDENT);
      expect(res.accessToken).toBe('signed-token');
      expect(res).not.toHaveProperty('password');
    });

    it('throws Conflict when the email exists', async () => {
      repo.findOne.mockResolvedValue({ id: 'x' });
      await expect(service.register(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    it('returns a token for valid credentials', async () => {
      mockLookup({
        id: 'u1',
        email: 'a@b.c',
        role: UserRole.INSTRUCTOR,
        password: await bcrypt.hash('pw12345', 4),
      });
      const res = await service.login({ email: 'a@b.c', password: 'pw12345' });
      expect(res.accessToken).toBe('signed-token');
      expect(res).not.toHaveProperty('password');
    });

    it('rejects a wrong password and an unknown user alike', async () => {
      mockLookup({ password: await bcrypt.hash('right', 4) });
      await expect(
        service.login({ email: 'a@b.c', password: 'wrong' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      mockLookup(null);
      await expect(
        service.login({ email: 'x@y.z', password: 'whatever' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
