export class UserResponseDto {
  id: string;
  name: string;
  email: string;
  role: string;
  timezone?: string;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
