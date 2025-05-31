import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { RegisterDto } from '../auth/dto/register.dto';
import { UserRole } from 'src/common/enums/user-role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Find a user by email.
   * Used primarily by AuthService to validate credentials.
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  /**
   * Find a user by ID.
   * Throws NotFoundException if not found.
   */
  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  /**
   * Create a new user (called by AuthController during registration).
   * `RegisterDto` should include: name, email, password, role.
   */
  async create(registerDto: RegisterDto): Promise<User> {
    // 1) Check if email already exists
    const exists = await this.userRepository.count({
      where: { email: registerDto.email },
    });
    if (exists > 0) {
      throw new BadRequestException('Email already in use');
    }

    // 2) Concatenate firstName + lastName into the entity's `name` field
    const fullName = `${registerDto.firstName} ${registerDto.lastName}`;

    // 3) Explicitly cast registerDto.role to UserRole (it’s already typed as UserRole from step #1)
    const role: User['role'] = registerDto.role ?? UserRole.ATTENDEE;

    const user = this.userRepository.create({
      name: fullName,
      email: registerDto.email,
      password: registerDto.password,
      role: role,
      timezone: registerDto.timezone ?? null,
    });

    return this.userRepository.save(user);
  }

  /**
   * Update own profile (name and/or timezone).
   * Returns the updated User.
   */
  async updateProfile(userId: string, updateDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(userId);

    if (updateDto.name !== undefined) {
      user.name = updateDto.name;
    }
    if (updateDto.timezone !== undefined) {
      user.timezone = updateDto.timezone;
    }

    return this.userRepository.save(user);
  }
}
