# TODO

Track outstanding tasks by area. Check items off as completed.

## Homepage
- [x] Fix blurry carousel cards; investigate any overlay filters causing blur.
- [x] Improve information density and layout on carousel/info cards for more visual appeal.
- [ ] Consider alternate info-card layout: descriptions first, uniform-size photos underneath.
- [x] Remove “Welcome”, circular elements, subheadings, and the horizontal line across pages.
- [x] Remove inner blue background cards; place text directly on the white card background.
- [x] Make all buttons a uniform pastel turquoise.
- [x] Set info card background to a very light teal/light green/pastel turquoise.

## Sign In
- [x] Remove “Continue with Facebook” option from sign-in page.
- [x] Increase Chippy (mascot) size on the sign-in form.
- [x] Reduce sign-in panel height to fit smaller screens.

## Report Writer (app.html)
- [x] Use `public/mascot/mascot-up.png` (Chippy) on this page.
- [x] Remove “Report builder” subheading and the horizontal line.
- [x] Unify button colors (step-by-step controls) to match site theme.
- [x] Change textarea light blue background to a light pastel turquoise.
- [x] Make button colors for “Generate full report”, “Get improvement ideas”, and “Improvement Ideas” uniform and on-theme.
- [x] Adjust “Generate Report” animation: current green cloud is hard to see; improve contrast/visibility.

## API Instructions
- [ ] Ensure generated reports exclude greetings (e.g., “It gives me pleasure…”, “Dear…”) and sign-offs (e.g., “Yours…”).
- [ ] Prioritize text from the “Custom instructions” input in the report template over generic rules. If custom instructions specify a salutation or pattern, they override the default “no greeting” guidance.

## Register
- [ ] Remove “Register” subheading and the horizontal line.

## Templates
- [ ] Fix bug: templates are not consistently saved to profiles. Some save to Supabase, others don’t. Verify client and backend setup.

## Emails
- [ ] Ensure brand name appears in all auth emails and messages: confirmation, Google sign-in, and password reset.
