export interface AppUser {
  id: string
  clerkId: string
  email: string
  fullName: string | null
  businessName: string | null
  businessType: string | null
  city: string | null
  state: string | null
  zip: string | null
  websiteUrl: string | null
  onboardingCompleted: boolean
  subscriptionStatus: string
  plan: string
  trialEndsAt: Date | null
  createdAt: Date
}
