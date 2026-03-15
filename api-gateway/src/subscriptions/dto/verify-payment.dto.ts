import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { SubscriptionPlanName } from './create-order.dto';

export class VerifyPaymentDto {
  @IsString()
  @IsNotEmpty()
  razorpayOrderId: string;

  @IsString()
  @IsOptional()
  razorpayPaymentId?: string;

  @IsString()
  @IsOptional()
  razorpaySignature?: string;

  @IsEnum(SubscriptionPlanName)
  @IsNotEmpty()
  plan: SubscriptionPlanName;
}
