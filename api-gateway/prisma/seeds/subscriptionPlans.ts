import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const plans = [
    {
      name: 'free',
      displayName: 'Free',
      priceInrPaise: 0,
      billingCadence: 'lifetime',
      maxInterviews: 2,
      maxQuestionsPerInterview: 5,
      answerTimeLimitSeconds: 120,
      facialAnalysisEnabled: true,
    },
    {
      name: 'basic_lite',
      displayName: 'Basic Lite',
      priceInrPaise: parseInt(process.env.PRICE_BASIC_LITE_PAISE || '4500', 10),
      billingCadence: 'daily',
      maxInterviews: 10,
      maxQuestionsPerInterview: 10,
      answerTimeLimitSeconds: null,
      facialAnalysisEnabled: false,
    },
    {
      name: 'basic',
      displayName: 'Basic',
      priceInrPaise: parseInt(process.env.PRICE_BASIC_PAISE || '6900', 10),
      billingCadence: 'daily',
      maxInterviews: 10,
      maxQuestionsPerInterview: 10,
      answerTimeLimitSeconds: null,
      facialAnalysisEnabled: true,
    },
    {
      name: 'premium_lite',
      displayName: 'Premium Lite',
      priceInrPaise: parseInt(process.env.PRICE_PREMIUM_LITE_PAISE || '18000', 10),
      billingCadence: 'monthly',
      maxInterviews: 40,
      maxQuestionsPerInterview: 10,
      answerTimeLimitSeconds: null,
      facialAnalysisEnabled: false,
    },
    {
      name: 'premium',
      displayName: 'Premium',
      priceInrPaise: parseInt(process.env.PRICE_PREMIUM_PAISE || '24900', 10),
      billingCadence: 'monthly',
      maxInterviews: 40,
      maxQuestionsPerInterview: 10,
      answerTimeLimitSeconds: null,
      facialAnalysisEnabled: true,
    },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { name: plan.name },
      update: {
        displayName: plan.displayName,
        priceInrPaise: plan.priceInrPaise,
        billingCadence: plan.billingCadence,
        maxInterviews: plan.maxInterviews,
        maxQuestionsPerInterview: plan.maxQuestionsPerInterview,
        answerTimeLimitSeconds: plan.answerTimeLimitSeconds,
        facialAnalysisEnabled: plan.facialAnalysisEnabled,
      },
      create: {
        name: plan.name,
        displayName: plan.displayName,
        priceInrPaise: plan.priceInrPaise,
        billingCadence: plan.billingCadence,
        maxInterviews: plan.maxInterviews,
        maxQuestionsPerInterview: plan.maxQuestionsPerInterview,
        answerTimeLimitSeconds: plan.answerTimeLimitSeconds,
        facialAnalysisEnabled: plan.facialAnalysisEnabled,
      },
    });
  }

  console.log('✅ Subscription plans seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
