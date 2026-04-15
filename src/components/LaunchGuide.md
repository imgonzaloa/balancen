# Balancen - Complete App Store Launch Guide

## 🎯 SUMMARY

**Goal:** Release Balancen on iOS App Store + Google Play Store  
**Timeline:** 4-5 weeks  
**Platforms:** iPhone (iOS 14+) + Android (API 21+)  
**Languages:** English + Spanish  
**Monetization:** Freemium with Stripe payments  

---

## CRITICAL FILES TO CREATE

### 1. Privacy Policy Page (NEW)
Create a privacy policy page in the app showing:
- Data we collect (email, meals, photos)
- How we use it (meal analysis, recommendations)
- Third parties: Stripe, Base44, OpenAI
- User rights: delete account, export data
- Contact: privacy@balancen.app

### 2. Terms of Service Page (NEW)
Create terms page explaining:
- User account responsibilities
- NOT medical advice (fitness disclaimer)
- Premium subscription terms
- Liability limitations
- Data deletion policy

### 3. App Icon Assets
Create 1024x1024 PNG icon:
- Balancen logo
- No rounded corners
- Fully opaque background
- Export: icon.png

### 4. Screenshots (6-8 total)
Take screenshots of:
1. **Home tab** - Daily meal tracker
2. **Camera screen** - Taking meal photo
3. **Meal result** - Nutrition breakdown
4. **Workouts tab** - Trainer dashboard
5. **Friends/Social** - Social features
6. **Profile** - User profile & stats
7. **Premium screen** - Upgrade page
8. **Settings** - Language switching

Save as PNG, 1080x1920 (iPhone) or 1080x1920 (Android)

### 5. Manifest.json (PWA)
Add to public folder:
- App name, description
- Icon references
- Theme color (#0f172a)
- Display: standalone
- Shortcuts: Log Meal, Start Workout

### 6. Support Email
Create professional support email:
- support@balancen.app
- Set up email forwarding
- Create response templates
- Add to app (Settings page)

---

## WEEK 1-2: SETUP

### Create Developer Accounts
**Apple:**
- Go to developer.apple.com
- Sign up ($99/year)
- Create Apple Developer account
- Create team (optional)

**Google:**
- Go to play.google.com
- Sign up ($25 one-time)
- Create business account
- Add payment method

### Create App Entries
**Apple App Store Connect:**
- New App > iOS
- Bundle ID: com.balancen.app
- Name: Balancen
- Primary Language: English
- Category: Health & Fitness

**Google Play Console:**
- Create App
- Name: Balancen
- Category: Health & Fitness
- Content rating: Complete questionnaire

### Create Business Info
- [ ] Support email: support@balancen.app
- [ ] Support website: https://balancen.app
- [ ] Business address (real or PO Box)
- [ ] Support phone (optional)

---

## WEEK 2-3: ASSETS & COMPLIANCE

### Legal Documents
Create 2 pages in your app OR website:

**Privacy Policy Page:**
- Copy template from: components/LaunchGuide.md
- Customize for Balancen
- Link from Settings > Privacy Policy
- Also add to website footer

**Terms of Service Page:**
- Explain free vs premium features
- Fitness disclaimer (NOT medical advice)
- Payment terms (Stripe handles it)
- Link from Settings > Terms
- Also add to website footer

### Screenshots (Essential)
Take 6-8 high-quality screenshots:
- iPhone 14 Pro Max (6.7-inch) for iOS
- Pixel 8 (6.3-inch) for Android
- Include text: Feature name, benefits
- No watermarks, clean UI
- Export as PNG

### Marketing Assets
- [ ] App icon (1024x1024 PNG)
- [ ] Feature image (1200x500 PNG for Android)
- [ ] Video preview (30 sec MP4) - optional
- [ ] Social media graphics

---

## WEEK 3: TESTING

### Device Testing Checklist
Test on REAL devices:
- [ ] iPhone 14 Pro (latest iOS)
- [ ] iPhone SE (oldest iOS)
- [ ] Pixel 8 (latest Android)
- [ ] Budget Android phone
- [ ] WiFi + 4G networks

### Test Scenarios
- [ ] App launches without crash
- [ ] Login/logout works
- [ ] Meal logging: camera ✓
- [ ] Meal logging: gallery ✓
- [ ] Profile photo: camera ✓
- [ ] Profile photo: gallery ✓
- [ ] Language: switch EN/ES ✓
- [ ] Premium: see "Upgrade" button ✓
- [ ] Premium: Stripe checkout works ✓
- [ ] Offline: can view recent data ✓
- [ ] Navigation: all tabs responsive ✓

### Performance Testing
- [ ] First load <3 seconds
- [ ] Smooth scrolling
- [ ] No memory leaks
- [ ] Images load correctly

---

## WEEK 4: iOS SUBMISSION

### Pre-Submission
1. Update version to **1.0.0**
2. Update build to **1**
3. Create production certificate in Xcode
4. Create provisioning profile
5. Archive app (Product > Archive)
6. Validate (no errors/warnings)

### App Store Connect
1. Go to App Store Connect
2. Select your app
3. Fill out App Information:
   - **Subtitle:** "Track meals, workouts & build consistency"
   - **Description:** (4000 chars max)
     ```
     Balancen helps you track nutrition and fitness with AI coaching.
     
     ✨ FEATURES:
     • Meal logging with photo recognition
     • Daily calorie & macro tracking
     • Personalized workout plans (Premium)
     • Social features - train with friends (Premium)
     • Advanced progress analytics (Premium)
     • Language support: English & Spanish
     
     🔐 PRIVACY:
     • Your health data is private
     • We don't sell your information
     • Easy account deletion anytime
     
     💪 PREMIUM:
     Starting at $9.99/month or $89.99/year
     Free 7-day trial available
     Cancel anytime
     ```
   - **Keywords:** (comma-separated, 100 chars)
     ```
     fitness, nutrition, meal tracking, AI coach, workouts
     ```
   - **Support URL:** https://balancen.app/support
   - **Privacy Policy URL:** https://balancen.app/privacy
   - **App Category:** Health & Fitness

4. Upload Screenshots:
   - 6.7-inch display (iPhone 14 Pro Max)
   - 6 screenshots for best results
   - Auto-scaled to other devices

5. Upload App Preview (optional):
   - 30 seconds max
   - MP4 format
   - 1920x1080 or 1280x720

6. Complete App Review Information:
   - Age Rating: 4+ (select in questionnaire)
   - Content Rights Certification: Check box
   - Export Compliance: Confirm (standard encryption only)
   - Third-Party Content: Check if adding external links

7. Create Test Account:
   - Email: appreviewer@balancen.app
   - Password: [secure 16-char password]
   - Add test account in Settings > Users

8. Add Reviewer Notes:
   ```
   Thank you for reviewing Balancen.
   
   Balancen is a fitness & nutrition tracker with AI coaching.
   
   TEST ACCOUNT (FREE TIER):
   Email: appreviewer@balancen.app
   Password: [password]
   
   TEST PREMIUM (OPTIONAL - SANDBOX):
   Use App Store sandbox payment
   Card: 4111 1111 1111 1111
   
   FEATURES TO TEST:
   1. Tap Home > "Log Meal" > Camera
   2. Tap Profile > profile photo > Camera
   3. Tap Profile > Settings > Language
   4. Tap "Upgrade to Premium" on Home
   
   All data is test data and safe to delete.
   ```

9. Upload Build:
   - Select Xcode archive
   - Wait for processing (5-10 min)
   - Verify build appears

10. Click "Submit for Review"
    - Apple reviews in **24-48 hours**
    - Check status daily

---

## WEEK 4: ANDROID SUBMISSION

### Pre-Submission
1. Update versionCode to **1**
2. Update versionName to **"1.0.0"**
3. Build Release APK/AAB:
   ```bash
   ./gradlew bundleRelease
   ```
4. Sign with production key
5. Test signed APK on device

### Google Play Console
1. Go to Play Console
2. Select your app
3. Fill out Store Listing:
   - **Title:** Balancen
   - **Short Description** (80 chars):
     ```
     Track meals & build fitness consistency with AI coaching
     ```
   - **Full Description:** (4000 chars)
     [Same as iOS description above]
   - **Screenshots:** 6 vertical (1080x1920 PNG)
   - **Feature Graphic:** 1024x500 PNG
   - **Category:** Health & Fitness

4. Content Rating:
   - Complete IARC questionnaire
   - Usually: 3+ (Everyone)

5. Pricing & Distribution:
   - Available in: Select countries (US, ES, etc.)
   - Price: Free (with in-app purchases)
   - Terms accepted: ✓

6. Upload Build:
   - Go to Release > Production
   - Upload AAB file
   - Review plays

7. Add Release Notes:
   ```
   Balancen 1.0 - Launch Edition
   
   ✨ Features:
   • Meal logging with AI photo analysis
   • Daily nutrition tracking
   • Personalized AI coaching (Premium)
   • Social features & friends (Premium)
   
   🔐 Privacy:
   • Your health data stays private
   • No ads, no data selling
   • Delete account anytime
   
   Enjoy building consistency! 🔥
   ```

8. Click "Review & Roll Out to Production"
   - Google reviews in **2-4 hours**
   - Much faster than Apple!

---

## WEEK 5: LAUNCH

### When Both Apps Approved ✅

1. **Activate Release:**
   - iOS: Press "Release to App Store"
   - Android: Press "Roll out"
   - Apps go live within 24 hours

2. **Monitor First 48 Hours:**
   - Check crash reports daily
   - Monitor user ratings
   - Respond to reviews quickly
   - Check Stripe for payments
   - Monitor analytics

3. **Announce:**
   - Social media post
   - Email to waitlist
   - Website blog post
   - Friends/family

---

## ONGOING: SUPPORT

### First Month
- [ ] Respond to every review
- [ ] Fix bugs within 24 hours
- [ ] Monitor crash reports
- [ ] Check payment issues
- [ ] Track daily downloads

### Monthly
- [ ] Release bug fixes (v1.0.1, v1.0.2)
- [ ] Analyze user feedback
- [ ] Plan next features
- [ ] Monitor performance metrics

### Quarterly
- [ ] Release feature updates (v1.1)
- [ ] A/B test onboarding
- [ ] Optimize app store listing
- [ ] Review monetization

---

## KEY LINKS

**iOS App Store Connect:**
https://appstoreconnect.apple.com

**Google Play Console:**
https://play.google.com/console

**Stripe Dashboard:**
https://dashboard.stripe.com

**Support Template:**
"Thank you for your review! We'd love to help. Email support@balancen.app"

---

**Questions? Review BEFORE submitting!**