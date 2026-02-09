# Balancen - App Store Submission Checklist

**Target Release Date: Q2 2026**

---

## 📋 PRE-SUBMISSION

### App Metadata
- [x] App Name: "Balancen - Fitness & Wellness"
- [x] Subtitle: "Track meals, workouts & build consistency"
- [x] Bundle ID: `com.balancen.app` (iOS) / `com.balancen.app` (Android)
- [x] Version: `1.0.0` (update before each submission)
- [x] Category: Health & Fitness
- [ ] Keywords: fitness, health, nutrition, wellness, AI coaching, meal tracking
- [ ] Support Email: support@balancen.app
- [ ] Support Website: https://balancen.app

### Compliance Documents
- [ ] Privacy Policy (create page)
- [ ] Terms of Service (create page)
- [ ] Test Account (email/password for reviewers)
- [ ] Review Notes: Explain free tier vs Premium
- [ ] Contact Info: Email, phone, address

### App Configuration
- [ ] App Icon (1024x1024)
- [ ] Preview Images (2-5 screenshots)
- [ ] Manifest.json (PWA)
- [ ] Privacy Policy linked in app

### Age Rating
- [ ] ESRB (US): 13+
- [ ] PEGI (EU): 7+
- [ ] Complete both questionnaires

---

## 📸 SCREENSHOTS & MARKETING

### iOS Screenshots (6.7-inch)
1. Home - Daily tracker
2. Meal logging
3. Workouts
4. Friends/Social
5. Premium upsell

### Android Screenshots (6-inch)
Same 5 screenshots + tablet versions

### Video Preview (Optional)
- 15-30 seconds
- MP4, 1920x1080, 30fps
- Show: meal logging → workout → social → premium

---

## 🔐 SECURITY & DATA

### Permissions Requested
**iOS:**
- Camera (meal photos)
- Photo Library (uploads)

**Android:**
- CAMERA
- READ/WRITE_EXTERNAL_STORAGE
- INTERNET
- ACCESS_NETWORK_STATE

### Data Handling
- [x] HTTPS/TLS encryption
- [x] No third-party data sharing
- [x] User consent for analytics
- [ ] GDPR compliant (EU)
- [ ] CCPA compliant (CA)

### Code Security
- [ ] No hardcoded API keys
- [ ] All secrets in env variables
- [ ] No test/debug code
- [ ] Signed with production cert

---

## ✅ APP QUALITY

### Critical Testing
- [ ] All tabs navigate
- [ ] Login/logout works
- [ ] Meal logging (camera + gallery)
- [ ] Profile photo change (camera + gallery)
- [ ] Language switching
- [ ] Premium gate working
- [ ] Stripe checkout works
- [ ] No crashes on startup
- [ ] No infinite loading

### Performance Targets
- [ ] Load <3 seconds
- [ ] Smooth 60fps
- [ ] No memory leaks
- [ ] Offline handling

### Accessibility
- [ ] High contrast text
- [ ] Touch targets >44x44
- [ ] Screen reader labels
- [ ] No strobing/flashing

### Languages
- [ ] English complete
- [ ] Spanish complete
- [ ] Date/number formats

---

## 🔌 BACKEND

### Environment
- [ ] Production API verified
- [ ] Stripe keys (production)
- [ ] Currencies: USD, EUR, ARS
- [ ] Email service ready
- [ ] Cloud storage active

### Monitoring
- [ ] Error tracking (Sentry)
- [ ] Analytics enabled
- [ ] Webhook verified
- [ ] Crash reporting on
- [ ] Backups scheduled

---

## 📱 PLATFORM-SPECIFIC

### iOS
- [ ] Xcode project created
- [ ] Code signing cert
- [ ] Bundle ID: com.balancen.app
- [ ] Version: 1.0.0, Build: 1
- [ ] Screenshots uploaded
- [ ] Privacy Policy URL
- [ ] Test account created
- [ ] Age rating complete

### Android
- [ ] Gradle project setup
- [ ] Signing key created
- [ ] APK/Bundle built
- [ ] Screenshots uploaded
- [ ] Privacy Policy URL
- [ ] Content rating done
- [ ] Test account ready

---

## 🚀 SUBMISSION

### Before Submitting
- [ ] Final build on real devices
- [ ] Screenshots verified
- [ ] Privacy policy live
- [ ] Support email ready
- [ ] Team on standby

### Submit iOS
- [ ] Upload build
- [ ] Add reviewer notes with test account
- [ ] Submit for review
- **Typical approval: 24-48h**

### Submit Android
- [ ] Upload APK/AAB
- [ ] Add release notes
- [ ] Submit to production
- **Typical approval: 2-4h**

---

## 📊 SUCCESS METRICS

**Month 1:**
- 500+ downloads
- 4.0+ stars
- <1% crash rate
- 50+ Premium subs

**Month 3:**
- 10,000+ downloads
- 1,000+ Premium subs
- Organic 50% of installs
- <0.5% crash rate