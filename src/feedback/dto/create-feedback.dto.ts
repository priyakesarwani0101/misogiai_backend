import { IsOptional, IsString, IsIn, ValidateIf } from 'class-validator';
import { FeedbackType } from '../../common/enums/feedback-type.enum';

export class CreateFeedbackDto {
  @ValidateIf((o) => o.type === FeedbackType.TEXT)
  @IsString()
  @IsOptional()
  comment?: string;

  @ValidateIf((o) => o.type === FeedbackType.EMOJI)
  @IsString()
  @IsOptional()
  emoji?: string;

  // The controller can infer type based on which field is present.
}

// dtos/flag-feedback.dto.ts (optional):
// { flagged: boolean } if you want un-flag as well.
