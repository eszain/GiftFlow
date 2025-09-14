import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = { PORT: parseInt(process.env.PORT || '3001', 10) };

export const config = {
  // AI Analysis
  ai: {
    maxRetries: 3,
    timeout: 30000,
    confidenceThreshold: 0.7,
  },
  
  // URL Classification
  url: {
    allowedHosts: [
      'gofundme.com',
      'fundly.com',
      'crowdfunder.com',
      'kickstarter.com',
      'indiegogo.com',
      'donorschoose.org',
      'causes.com',
      'fundrazr.com',
      'crowdrise.com',
      'youcaring.com',
      'giveforward.com',
      'fundly.com',
      'crowdfund.com',
      'crowdtilt.com',
      'fundrazr.com',
      'razoo.com',
      'firstgiving.com',
      'networkforgood.org',
      'justgiving.com',
      'crowdrise.com',
      'causevox.com',
      'donately.com',
      'charitywater.org',
      'redcross.org',
      'unicef.org',
      'doctorswithoutborders.org',
      'savechildren.org',
      'worldwildlife.org',
      'nature.org',
      'cancer.org',
      'heart.org',
      'diabetes.org',
      'alz.org',
      'parkinsons.org',
      'arthritis.org',
      'lupus.org',
      'crohnsandcolitis.org',
      'autism.org',
      'specialolympics.org',
      'goodwill.org',
      'salvationarmy.org',
      'unitedway.org',
      'feedingamerica.org',
      'foodbank.org',
      'habitat.org',
      'bigbrothersbigsisters.org',
      'boysandgirlsclubs.org',
      'ymca.org',
      'ywca.org',
      'scouts.org',
      'girlscouts.org',
      '4h.org',
      'boyscouts.org',
      'girlscouts.org',
      'campfire.org',
      'boysandgirlsclubs.org',
      'bigbrothersbigsisters.org',
      'mentor.org',
      'cityyear.org',
      'americorps.org',
      'peacecorps.org',
      'habitat.org',
      'rebuildingtogether.org',
      'volunteermatch.org',
      'idealist.org',
      'dosomething.org',
      'volunteer.gov',
      'serve.gov',
      'nationalservice.gov',
      'corporationfornationalservice.gov',
      'americorps.gov',
      'peacecorps.gov'
    ],
    suspiciousPatterns: [
      /bit\.ly/i,
      /tinyurl\.com/i,
      /goo\.gl/i,
      /t\.co/i,
      /short\.link/i,
      /url\.short/i,
      /link\.short/i,
      /tiny\.cc/i,
      /is\.gd/i,
      /v\.gd/i,
      /qr\.ae/i,
      /ow\.ly/i,
      /buff\.ly/i,
      /rebrand\.ly/i,
      /bit\.do/i,
      /short\.io/i,
      /cutt\.ly/i,
      /short\.link/i,
      /tiny\.one/i,
      /short\.url/i
    ],
    blockedDomains: [
      'malicious-site.com',
      'scam-site.org',
      'phishing-link.net',
      'fake-charity.com',
      'fraud-fundraiser.org'
    ]
  },
  
  // Charity Verification
  charity: {
    irsApiTimeout: 10000,
    cacheTtl: 24 * 60 * 60 * 1000, // 24 hours
    maxRetries: 3
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100
  }
};