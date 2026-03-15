import { IsEnum, IsNotEmpty } from 'class-validator';

export enum SubscriptionPlanName {
  BASIC_LITE = 'basic_lite',
  BASIC = 'basic',
  PREMIUM_LITE = 'premium_lite',
  PREMIUM = 'premium',
}

export class CreateOrderDto {
  @IsEnum(SubscriptionPlanName)
  @IsNotEmpty()
  plan: SubscriptionPlanName;
}
