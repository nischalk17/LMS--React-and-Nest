import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { Progress } from '../entities/progress.entity';
import { Enrollment } from '../entities/enrollment.entity';
import { Module } from '../entities/module.entity';

describe('ProgressService', () => {
  let service: ProgressService;
  const progressRepo = {
    findOne: jest.fn(),
    create: jest.fn((p: Partial<Progress>) => ({ ...p })),
    save: jest.fn((p: Partial<Progress>) => Promise.resolve(p)),
  };
  const enrollmentRepo = { findOne: jest.fn() };
  const moduleRepo = { exists: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        ProgressService,
        { provide: getRepositoryToken(Progress), useValue: progressRepo },
        { provide: getRepositoryToken(Enrollment), useValue: enrollmentRepo },
        { provide: getRepositoryToken(Module), useValue: moduleRepo },
      ],
    }).compile();
    service = moduleRef.get(ProgressService);
  });

  it('404s when the enrollment is not the student’s own', async () => {
    enrollmentRepo.findOne.mockResolvedValue(null);
    await expect(
      service.updateProgress('e1', 'm1', 100, 'someone-else'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(progressRepo.save).not.toHaveBeenCalled();
  });

  it('404s when the module is not part of the enrolled course', async () => {
    enrollmentRepo.findOne.mockResolvedValue({ id: 'e1', courseId: 'c1' });
    moduleRepo.exists.mockResolvedValue(false);
    await expect(
      service.updateProgress('e1', 'm-other', 100, 's1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it.each([
    [100, true],
    [99, false],
    [0, false],
  ])('at %s%% isCompleted is %s', async (pct, completed) => {
    enrollmentRepo.findOne.mockResolvedValue({ id: 'e1', courseId: 'c1' });
    moduleRepo.exists.mockResolvedValue(true);
    progressRepo.findOne.mockResolvedValue(null);

    const res = await service.updateProgress('e1', 'm1', pct, 's1');
    expect(res.completionPercentage).toBe(pct);
    expect(res.isCompleted).toBe(completed);
  });
});
