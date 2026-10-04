# V1 TRUST & SAFETY OPERATING SPECIFICATION

## Product
**Project Connect**

## Version
**V1.0**

## Product Category
Verified Indian-diaspora social, community, event, and dating platform

## Initial Market
Dallas–Fort Worth, Texas

## Platforms
- iOS
- Android
- Admin Web Console

## Audience
18+ only

## Status
Approved downstream artifact based on:
- Product Requirements Document
- Screen-by-Screen UX + Functional Specification
- Business Rules Catalog
- Data Model + Data Dictionary
- Authorization Specification

---

# 1. PURPOSE

Project Connect depends on people trusting the platform enough to:

- display their identity;
- interact with strangers;
- participate in private conversations;
- express dating interest;
- attend real-world events;
- meet people offline.

Trust & Safety is therefore a **core product capability**, not an administrative function.

This specification defines:

- prohibited behavior;
- severity levels;
- reporting;
- triage;
- investigation;
- enforcement;
- escalation;
- moderator permissions;
- evidence handling;
- appeals;
- repeat-offender logic;
- automated detection;
- event safety;
- underage safeguards;
- fraud/scam controls;
- sexual misconduct rules;
- harassment controls;
- crisis handling;
- quality assurance;
- moderator wellness;
- transparency;
- operational metrics.

---

# 2. TRUST & SAFETY OBJECTIVE

The safety system must maximize:

**legitimate human connection**

while minimizing:

- harassment;
- deception;
- unwanted sexual behavior;
- scams;
- stalking;
- threats;
- impersonation;
- spam;
- exploitation;
- privacy violations;
- unsafe offline interactions.

The operating philosophy is:

> **Enable connection without sacrificing consent, privacy, or personal safety.**

---

# 3. SAFETY PRINCIPLES

## 3.1 Consent Before Access

No product feature should create social access beyond what the recipient has consented to.

Examples:

- connection acceptance before messaging;
- dating opt-in before dating visibility;
- attendee privacy before event visibility.

---

## 3.2 Block Must Be Immediate

Blocking is a safety control.

It must never wait for moderator approval.

---

## 3.3 Report Must Be Easy

Users should not need to:

- search Help pages;
- email support;
- explain policies;
- contact moderators externally

to report another person.

Report must be accessible directly from:

- profile;
- chat;
- message where applicable;
- event.

---

## 3.4 Safety Cannot Be Paywalled

Free users receive the same fundamental:

- block;
- report;
- privacy;
- account deletion;
- safety protections

as premium users.

---

## 3.5 High-Risk Harm Takes Priority

Reports involving credible physical harm, exploitation, minors, stalking, or extortion take operational priority over ordinary policy violations.

---

## 3.6 Evidence Minimization

Collect only evidence required to investigate the reported behavior.

Moderators should not receive unrestricted access to user conversations.

---

## 3.7 Human Review for Consequential Decisions

Permanent bans and other high-impact enforcement should ordinarily involve human review unless an exceptionally high-confidence system rule applies.

---

## 3.8 Appeals Are Part of Safety Quality

Enforcement can be wrong.

A controlled appeals process is necessary to:

- correct false positives;
- identify policy ambiguity;
- improve moderator quality;
- maintain user trust.

---

# 4. SAFETY OWNERSHIP

Trust & Safety has five operational functions.

```text
Policy
   ↓
Detection
   ↓
Moderation Operations
   ↓
Enforcement
   ↓
Quality & Appeals
```

---

# 5. RESPONSIBILITY MODEL

## Product

Responsible for:

- safety-by-design features;
- report/block UX;
- privacy controls;
- friction against abuse.

## Engineering

Responsible for:

- enforcement infrastructure;
- evidence security;
- rate limits;
- moderation tooling;
- logging.

## Trust & Safety Operations

Responsible for:

- report review;
- investigations;
- enforcement recommendations;
- escalation.

## Trust & Safety Policy

Responsible for:

- defining prohibited behavior;
- severity standards;
- enforcement guidance;
- edge-case interpretation.

## Legal

Responsible for:

- statutory obligations;
- law-enforcement requests;
- emergency disclosures;
- preservation requests;
- mandatory reporting requirements.

---

# 6. USER SAFETY POLICY CATEGORIES

Project Connect V1 recognizes the following violation families:

1. Spam
2. Fake Profiles
3. Impersonation
4. Harassment
5. Sexual Harassment
6. Explicit Sexual Content
7. Hate / Abusive Conduct
8. Threats of Violence
9. Stalking
10. Doxxing / Privacy Abuse
11. Scam / Fraud
12. Financial Solicitation
13. Underage User
14. Child Sexual Exploitation Concern
15. Non-Consensual Intimate Content
16. Extortion / Sextortion
17. Event Safety Violations
18. Platform Manipulation
19. Ban Evasion
20. Other Harmful Conduct

---

# 7. ENFORCEMENT LEVELS

Enforcement must be proportional to:

- severity;
- intent;
- recurrence;
- victim risk;
- account history;
- confidence of evidence.

V1 enforcement levels:

```text
E0 — No Action

E1 — Education / Warning

E2 — Feature Restriction

E3 — Temporary Suspension

E4 — Permanent Ban

E5 — Emergency Safety Escalation
```

---

# 8. E0 — NO ACTION

Used when:

- no violation established;
- evidence insufficient;
- behavior permitted by policy;
- report is mistaken.

Report closes as:

`DISMISSED` or `RESOLVED_NO_VIOLATION`

Internal rationale required.

---

# 9. E1 — EDUCATION / WARNING

Used for lower-severity first violations.

Examples:

- mild unwanted solicitation;
- inappropriate contact-information sharing;
- repeated low-level spam;
- minor policy misunderstanding.

Warning should:

- identify policy area;
- explain expected behavior;
- avoid exposing reporter identity.

---

# 10. E2 — FEATURE RESTRICTION

Possible restrictions:

```text
CAN_DISCOVER=false

CAN_SEND_REQUESTS=false

CAN_MESSAGE=false

CAN_USE_DATING=false

CAN_RSVP=false
```

Suitable for:

- request spam;
- mass unsolicited outreach;
- repeated minor harassment;
- suspicious activity under investigation.

---

# 11. E3 — TEMPORARY SUSPENSION

Recommended configurable periods:

- 24 hours;
- 72 hours;
- 7 days;
- 30 days.

Use when temporary removal appropriately protects users and behavior may be remediable.

---

# 12. E4 — PERMANENT BAN

Appropriate for severe or repeated misconduct.

Examples:

- credible predatory behavior;
- serious threats;
- sextortion;
- repeated scam activity;
- underage deliberate access;
- severe stalking;
- repeated ban evasion;
- non-consensual intimate imagery;
- repeated severe harassment.

---

# 13. E5 — EMERGENCY SAFETY ESCALATION

E5 is an operational escalation, not merely an account penalty.

Potential triggers:

- imminent credible threat;
- active stalking with immediate danger;
- credible threat of suicide/homicide involving another user;
- potential child sexual exploitation;
- sextortion;
- kidnapping threat;
- credible real-world violence plan.

Escalation routes:

- senior Trust & Safety;
- legal;
- emergency protocol;
- law-enforcement liaison where legally appropriate.

---

# 14. REPORT SEVERITY LEVELS

```text
S1 — Low

S2 — Medium

S3 — High

S4 — Critical
```

---

# 15. S1 — LOW

Examples:

- non-malicious spam;
- inappropriate self-promotion;
- repeated unwanted connection requests without threats;
- profile-quality violations.

Target operational response:

**within 24 hours**

Initial launch operational target.

---

# 16. S2 — MEDIUM

Examples:

- harassment;
- explicit unsolicited sexual messaging;
- impersonation;
- repeated unwanted contact;
- fraud indicators without immediate financial loss.

Target initial review:

**within 8 hours**

---

# 17. S3 — HIGH

Examples:

- serious harassment;
- credible scam/fraud;
- stalking indicators;
- doxxing;
- sexual coercion;
- repeat severe offender.

Target initial review:

**within 2 hours**

during staffed operational periods.

---

# 18. S4 — CRITICAL

Examples:

- credible immediate physical threat;
- child exploitation concern;
- sextortion;
- severe stalking;
- credible imminent violence.

Target:

**Immediate prioritized review.**

Operational alerting should bypass ordinary queue ordering.

---

# 19. SEVERITY IS NOT DETERMINED ONLY BY REPORT CATEGORY

Severity can increase due to:

- explicit threat;
- repeated victim targeting;
- prior enforcement history;
- real-world meeting;
- location exposure;
- financial loss;
- vulnerability;
- multiple corroborating reports.

---

# 20. REPORT FLOW

User flow:

```text
Profile / Conversation / Event
        ↓
Report
        ↓
Select Category
        ↓
Add Optional Context
        ↓
Submit
        ↓
Immediate Safety Options
        ↓
Moderation Queue
```

---

# 21. POST-REPORT SAFETY OPTIONS

After submitting a report, user should be offered:

**Block this person**

where relevant.

Potential copy:

> You can also block this person now. They will no longer be able to contact or discover you.

---

# 22. REPORTER CONFIDENTIALITY

The subject must not receive:

- reporter name;
- reporter statement;
- evidence-selection information;
- moderator notes.

Exceptions only where legally required.

---

# 23. REPORT INTAKE DATA

Store:

- report ID;
- reporter;
- subject;
- report category;
- source;
- timestamp;
- free-form details;
- attached evidence references;
- account context;
- risk signals.

Do not automatically copy full conversation history.

---

# 24. REPORT TRIAGE PIPELINE

```text
Report Received
      ↓
Automated Risk Classification
      ↓
Severity Assignment
      ↓
Queue Routing
      ↓
Moderator Review
      ↓
Decision
      ↓
Enforcement
      ↓
Notification
      ↓
Appeal Eligibility
      ↓
QA Sampling
```

---

# 25. AUTOMATED TRIAGE INPUTS

May include:

- report category;
- keywords in reporter description;
- reported messages;
- number of recent reports;
- prior suspensions;
- account age;
- connection-request velocity;
- scam signals;
- device/account overlap;
- blocked-user history.

These signals prioritize review.

They must not automatically establish guilt.

---

# 26. MODERATOR CASE VIEW

Moderator should see:

### Case Information
- report ID;
- severity;
- category;
- submission time.

### Reporter Context
- masked identity;
- prior malicious-reporting signals if applicable.

### Subject Context
- profile;
- account age;
- verification status;
- relevant enforcement history.

### Evidence
Only evidence connected to the complaint.

### Relevant Interactions
- reported messages;
- connection context;
- block timing;
- event context.

---

# 27. MODERATOR SHOULD NOT SEE

Without separate authorization:

- unrelated conversations;
- unrelated dating activity;
- complete location history;
- billing details;
- raw authentication credentials;
- unrelated personal data.

---

# 28. INVESTIGATION STANDARD

Moderator should answer:

1. What allegedly happened?
2. What policy applies?
3. Is the evidence authentic/relevant?
4. Is context sufficient?
5. What is the severity?
6. Is there prior relevant behavior?
7. Is there ongoing risk?
8. What action is proportionate?
9. Is escalation necessary?

---

# 29. MODERATION DECISION RECORD

Every substantive case must record:

- policy violated;
- evidence reviewed;
- confidence;
- severity;
- action taken;
- reason;
- moderator;
- timestamp.

High-risk cases additionally record:

- escalation decision;
- consultation if any;
- safety-preservation action.

---

# 30. CONFIDENCE LEVELS

Recommended internal field:

```text
LOW
MEDIUM
HIGH
CONFIRMED
```

This separates:

**how harmful**

from:

**how certain we are.**

---

# 31. LOW CONFIDENCE + HIGH SEVERITY

Example:

A vague threat report with limited evidence.

Approach:

- prioritize human review;
- potentially restrict risky capabilities temporarily;
- avoid irreversible permanent action solely on weak evidence unless safety requires immediate containment.

---

# 32. SPAM POLICY

Prohibited:

- bulk connection requests;
- repetitive identical messages;
- promotional solicitation;
- lead generation;
- commercial advertising through profiles;
- external-link farming;
- mass event invitations outside approved tools.

---

# 33. SPAM SIGNALS

Examples:

- extreme request velocity;
- very low acceptance rate;
- identical intros;
- repeated URLs;
- many blocks;
- many spam reports;
- newly-created account + mass activity.

---

# 34. SPAM ENFORCEMENT

First lower-severity incident:

E1 warning or E2 request restriction.

Repeated/automated spam:

E3 suspension.

Dedicated spam/scam accounts:

E4 ban.

---

# 35. FAKE PROFILE POLICY

Prohibited:

- fabricated identity;
- stolen photos;
- AI-generated identity designed to deceive;
- misleading age;
- intentionally misleading gender/identity for exploitation;
- falsely claiming another person's identity.

Not every pseudonymous presentation is automatically fraudulent.

Use context.

---

# 36. FAKE PROFILE SIGNALS

- photo reuse across accounts;
- failed selfie verification;
- inconsistent identity data;
- large geographic inconsistencies;
- multiple user reports;
- stolen-image evidence.

---

# 37. IMPERSONATION

Impersonation exists when a user intentionally presents themselves as another identifiable person or organization in a materially deceptive way.

Potential enforcement:

High-confidence harmful impersonation:
E4.

Lower-confidence:
temporary restriction + verification request.

---

# 38. HARASSMENT POLICY

Prohibited harassment includes:

- repeated unwanted contact;
- targeted insults;
- degrading communication;
- intimidation;
- persistent pressure after rejection;
- abusive messages;
- coordinated targeting.

---

# 39. CONSENT SIGNALS IN HARASSMENT

Examples of clear rejection:

- connection declined;
- disconnect;
- block;
- explicit "stop";
- repeated non-response after warning context.

Creating another account to continue contact after rejection materially escalates severity.

---

# 40. SEXUAL HARASSMENT

Prohibited:

- unsolicited explicit sexual messages;
- unsolicited nude images;
- sexual demands;
- coercive sexual language;
- sexual threats;
- repeated sexual advances after rejection.

Dating opt-in does **not** equal consent to sexual content.

---

# 41. EXPLICIT SEXUAL CONTENT

Project Connect is not an adult-content platform.

Public profile content must not contain:

- nudity;
- pornography;
- explicit sexual acts;
- explicit sexual solicitation.

Private messaging is also subject to abuse policy.

---

# 42. CONSENSUAL SEXUAL CONVERSATION

V1 should not attempt to police every consensual adult private discussion.

However prohibited regardless of apparent consent:

- exploitation;
- minors;
- coercion;
- non-consensual imagery;
- commercial sexual solicitation where prohibited;
- threats;
- illegal material.

---

# 43. NON-CONSENSUAL INTIMATE CONTENT

Strictly prohibited:

- sharing intimate images without consent;
- threatening to share such images;
- requesting distribution of another person's private sexual images.

Recommended enforcement:

E4 + legal/safety escalation depending circumstances.

---

# 44. SEXTORTION

Definition:

Threatening to expose intimate content or personal information to obtain:

- money;
- sexual content;
- continued contact;
- other benefit.

Severity:

**S4**

Likely enforcement:

**Immediate E4 + E5 review.**

---

# 45. HATE / ABUSIVE CONDUCT

Prohibit targeted attacks based on protected or vulnerable characteristics according to applicable law/platform policy.

Distinguish:

- disagreement;
- cultural discussion;
- political/religious conversation

from targeted degrading attacks or incitement.

---

# 46. THREATS

Threat assessment should consider:

- specificity;
- target;
- means;
- timeframe;
- intent;
- credibility;
- context;
- repeated behavior.

---

# 47. THREAT EXAMPLES

Lower severity:

> "You'll regret this."

May require context.

Higher severity:

Specific statement involving:

- target;
- place;
- time;
- intended physical harm.

Treat as urgent.

---

# 48. CREDIBLE PHYSICAL THREAT PROTOCOL

```text
Report
 ↓
Immediate containment if appropriate
 ↓
Preserve relevant evidence
 ↓
Senior T&S review
 ↓
Legal/emergency assessment
 ↓
Account enforcement
 ↓
Victim safety communication
```

Do not instruct moderators to independently determine criminal guilt.

---

# 49. STALKING POLICY

Prohibited:

- repeated unwanted contact;
- following someone across accounts;
- tracking physical location;
- repeated appearance at events after explicit rejection;
- using third parties to contact a blocked user;
- surveillance behavior;
- threats involving known location.

---

# 50. STALKING ESCALATION FACTORS

Severity increases when:

- offline meeting occurred;
- home/work address known;
- target has blocked user;
- offender creates replacement accounts;
- target reports fear;
- threats are present.

---

# 51. DOXXING / PRIVACY ABUSE

Prohibited unauthorized publication of sensitive personal data intended or likely to facilitate harm.

Examples:

- home address;
- private phone;
- personal email;
- identity documents;
- financial information.

---

# 52. PRIVACY VIOLATION CONTEXT

Moderators must evaluate context.

Example:

A person posting their own business number is different from someone publishing another user's private phone number to harass them.

---

# 53. FRAUD / SCAM POLICY

Prohibited:

- romance scams;
- investment scams;
- cryptocurrency scams;
- gift-card scams;
- emergency-money scams;
- fake business opportunities;
- fraudulent ticket/event sales;
- identity theft attempts;
- account takeover attempts.

---

# 54. HIGH-RISK MONEY REQUEST

The product should consider friction/warnings when messages exhibit patterns such as:

- urgent request for money;
- wire transfer;
- gift cards;
- crypto wallet;
- bank credential request.

Do not automatically read every private message without a defined privacy and moderation basis.

Client-side or server-side classifiers require explicit governance.

---

# 55. ROMANCE SCAM PATTERN

Potential indicators:

```text
Very rapid emotional escalation
+
Avoids verification
+
Moves conversation off-platform
+
Requests money
+
Creates urgent crisis
```

No individual indicator proves fraud.

Combined signals may trigger review.

---

# 56. FINANCIAL SAFETY MESSAGE

Contextual educational messaging can state:

> Never send money, gift cards, cryptocurrency, banking credentials, or verification codes to someone you met through the app.

---

# 57. UNDERAGE POLICY

Project Connect is strictly 18+.

Any credible indication that a user is under 18 must be treated seriously.

---

# 58. UNDERAGE REPORT HANDLING

If credible:

1. restrict account promptly;
2. prevent discovery;
3. prevent messaging;
4. initiate age review;
5. preserve required evidence;
6. escalate if sexual interactions with adults are implicated.

---

# 59. AGE VERIFICATION ESCALATION

Potential tools:

- account information review;
- selfie-age estimation only if legally/policy appropriate;
- formal ID verification;
- human review.

Do not rely solely on appearance.

---

# 60. CHILD SEXUAL EXPLOITATION MATERIAL

Any suspected child sexual exploitation material or exploitation behavior requires special legal and operational handling.

This must not be handled as an ordinary moderation case.

Required:

- immediate access restriction;
- evidence preservation without unnecessary copying;
- escalation to designated legal/T&S personnel;
- compliance with applicable mandatory reporting obligations;
- no casual moderator redistribution of material.

---

# 61. CHILD SAFETY EVIDENCE ACCESS

Access should be limited to specifically trained personnel.

Do not include known or suspected illegal imagery in:

- ordinary QA datasets;
- moderator training decks;
- analytics;
- normal screenshots.

---

# 62. BAN EVASION

Ban evasion includes:

- new phone/account after permanent ban;
- using another person's account;
- repeated account recreation;
- device/account-linking circumvention.

---

# 63. BAN-EVASION SIGNALS

Potential signals:

- phone reuse;
- device characteristics;
- verification identity;
- payment account;
- profile photo similarity;
- network patterns.

Use cautiously to avoid false positives.

---

# 64. BAN-EVASION ENFORCEMENT

High-confidence ban evasion:

E4.

Linked accounts may be reviewed.

Do not automatically ban entire household/shared network solely based on IP.

---

# 65. EVENT SAFETY

Offline events introduce physical-world risk.

Each public V1 event requires:

- approved organizer;
- clearly identified venue;
- date/time;
- event rules;
- capacity where applicable.

---

# 66. EVENT VENUE GUIDELINE

For social/dating events, favor:

- public venue;
- legitimate commercial/community venue;
- clearly identifiable location.

Avoid platform-sponsored first meetings at:

- private residences;
- isolated locations

unless specific use case receives safety review.

---

# 67. EVENT REPORTING

Users can report:

- event;
- organizer;
- participant.

Event report categories may include:

- misleading event;
- unsafe venue;
- harassment;
- unauthorized commercial solicitation;
- organizer misconduct;
- fraud.

---

# 68. ORGANIZER SAFETY HISTORY

Organizer approval should consider:

- prior event complaints;
- cancellations;
- fraud;
- participant safety reports;
- identity validation.

Organizer status is revocable.

---

# 69. OFFLINE INCIDENT

If an incident occurs at or after a platform-enabled event:

Trust & Safety should capture:

- event;
- participants;
- allegation;
- available platform evidence;
- organizer response;
- severity.

Do not attempt to replace emergency services or law enforcement.

---

# 70. SAFETY CENTER

V1 should include a concise Safety Center accessible from:

- Profile/Settings;
- Help;
- Dating areas;
- Event pages.

---

# 71. SAFETY CENTER TOPICS

Include:

- meeting people safely;
- dating safety;
- scam awareness;
- reporting;
- blocking;
- privacy;
- event safety;
- financial scams.

---

# 72. FIRST-MEETING GUIDANCE

Recommended concise guidance:

- meet in a public place;
- arrange your own transportation;
- tell someone you trust;
- protect your home address;
- do not feel obligated to continue meeting;
- leave if uncomfortable.

---

# 73. PHONE / CONTACT SHARING

The app should not prohibit adults from voluntarily sharing contact information after connecting.

However:

- public profiles must not expose it;
- initial request messages may restrict it;
- users should be reminded sharing is optional.

---

# 74. AUTOMATED CONTENT MODERATION

Automation may be used for:

- profile photo screening;
- spam detection;
- explicit-image detection;
- scam-risk detection;
- threat prioritization;
- report routing.

---

# 75. AUTOMATION SHOULD NOT BE THE FINAL DECIDER FOR ALL CASES

Automation is appropriate for:

- obvious spam;
- known malicious patterns;
- queue prioritization;
- duplicate detection.

Human review preferred for:

- nuanced harassment;
- cultural context;
- threats;
- identity disputes;
- permanent bans;
- appeals.

---

# 76. AUTOMATED MODEL OUTPUT

Moderation ML should produce structured signals:

```text
riskCategory
riskScore
modelVersion
confidence
triggeredSignals
```

Not:

> User is guilty.

---

# 77. MODERATION MODEL VERSIONING

For each automated safety decision/significant signal retain:

- model version;
- policy version;
- evaluation timestamp.

Necessary for:

- audits;
- bias investigations;
- model rollback.

---

# 78. FALSE POSITIVE MONITORING

Monitor automated systems for:

- legitimate profiles rejected;
- harmless Telugu/Tamil/etc. phrases misclassified;
- cultural attire incorrectly flagged;
- common names falsely treated as spam;
- dating conversation wrongly flagged.

---

# 79. CULTURAL COMPETENCE

Because the audience spans multiple Indian languages and cultures, moderation must account for:

- Telugu;
- Hindi;
- Tamil;
- Kannada;
- Malayalam;
- Punjabi;
- Gujarati;
- Bengali;
- Marathi;
- mixed-language English transliteration.

Moderator guidance must recognize:

- colloquial speech;
- slang;
- cultural idioms;
- sarcasm;
- transliterated abuse.

---

# 80. MACHINE TRANSLATION

Machine translation may support review but should not be treated as infallible for consequential enforcement.

Low-confidence translation + high-impact case:

route to language-capable human review where possible.

---

# 81. REPEAT OFFENDER MODEL

Safety decisions should consider history.

Suggested internal fields:

```text
violation_count_30d
violation_count_180d
prior_warning_count
prior_restriction_count
prior_suspension_count
prior_severe_violation
```

Do not expose to users.

---

# 82. STRIKE SYSTEM

Avoid simplistic:

"3 strikes = ban"

for every violation.

A credible violent threat may justify immediate ban.

Three minor profile issues may not.

Use severity-weighted history.

---

# 83. EXAMPLE ENFORCEMENT WEIGHTING

Conceptually:

```text
Low violation          = 1
Medium                  = 3
High                    = 7
Critical                = 100 / immediate review
```

This should remain an internal decision aid, not an automatic justice formula.

---

# 84. PROFILE PHOTO MODERATION

Before public display screen for:

- nudity;
- explicit sexual content;
- gore;
- illegal content;
- advertisements;
- QR/contact information;
- suspicious impersonation.

---

# 85. PHOTO STATES

```text
PENDING
APPROVED
REJECTED
MANUAL_REVIEW
```

User should not receive opaque:

"Failed."

Provide safe category-level explanation.

Example:

> Profile photos must clearly represent you and cannot contain contact details or promotional graphics.

---

# 86. BIO MODERATION

Check for:

- contact information;
- external solicitation;
- hate;
- sexual solicitation;
- scam links;
- abusive language.

Moderation should prioritize education for low-harm first violations.

---

# 87. CONNECTION INTRO MODERATION

Because intro messages reach users before acceptance, apply stronger abuse prevention than ordinary mutual chat.

Potentially restrict:

- URLs;
- phone numbers;
- explicit sexual content;
- repeated templated text.

---

# 88. RATE-LIMIT SAFETY

Rate limits apply to:

- OTPs;
- connection requests;
- intro messages;
- report submissions;
- repeated profile views if stalking risk patterns emerge;
- login attempts.

Premium does not override abuse throttles.

---

# 89. REPORT ABUSE

Prohibited:

- coordinated false reporting;
- retaliation reports;
- repeatedly reporting users solely because they declined a connection.

Signals should reduce abuse without discouraging legitimate reporting.

---

# 90. FALSE REPORT ENFORCEMENT

Do not punish a user simply because a report was unsubstantiated.

Only intentional malicious reporting with strong evidence should be actioned.

---

# 91. REPORT DUPLICATION

Multiple reports against same user:

- should remain separate records;
- may be clustered into same investigation;
- should affect prioritization.

Do not simply merge and lose individual reporter evidence.

---

# 92. MODERATION QUEUES

Recommended:

```text
Critical Safety

High Risk

Harassment / Sexual Misconduct

Scam / Fraud

Identity / Impersonation

Spam

Profile Content

Events

Appeals
```

---

# 93. QUEUE PRIORITY

Order primarily by:

1. severity;
2. victim-risk indicators;
3. age of case;
4. number of reports;
5. enforcement history.

Not simply FIFO.

---

# 94. SLA CLOCK

Track:

- submitted_at;
- first_review_at;
- decision_at;
- enforcement_at;
- closed_at.

Metrics:

- time to first review;
- time to decision;
- time to enforcement.

---

# 95. TARGET OPERATIONAL SLAs

Initial V1 targets:

| Severity | Initial Review |
|---|---:|
| S4 Critical | Immediate priority |
| S3 High | <2 hours during staffed periods |
| S2 Medium | <8 hours |
| S1 Low | <24 hours |

These are internal operating targets, not contractual promises.

---

# 96. COVERAGE OUTSIDE STAFFED HOURS

Before launch, define an on-call route for:

- S4 safety reports;
- platform-wide abuse;
- security incidents.

Critical reports cannot wait until the next routine business day without a defined escalation policy.

---

# 97. MODERATOR ACTION SCREEN

For every enforcement action require:

### Policy
Dropdown.

### Severity
Selected/confirmed.

### Action
Warning/restriction/suspension/ban.

### Duration
if temporary.

### Internal Rationale
Required for material action.

### User Notification
Preview.

---

# 98. ENFORCEMENT NOTIFICATION

Affected user should generally receive:

- action taken;
- policy category;
- duration if temporary;
- next steps;
- appeal option if eligible.

Do not reveal:

- reporter identity;
- sensitive investigation details.

---

# 99. EXAMPLE WARNING

Title:

**A reminder about respectful communication**

Body should explain:

- behavior category;
- relevant rule;
- future consequence possibility.

Avoid accusatory or inflammatory language.

---

# 100. SUSPENSION NOTICE

Should contain:

- suspension duration;
- policy category;
- capabilities unavailable;
- appeal path.

---

# 101. BAN NOTICE

Should contain:

- account permanently restricted;
- broad policy basis;
- appeal path if eligible.

Do not provide abuse-detection details that enable circumvention.

---

# 102. APPEALS

Users should be able to appeal material actions such as:

- significant feature restriction;
- suspension;
- permanent ban;
- verification rejection where appropriate.

---

# 103. APPEAL REQUIREMENTS

Appeal submission captures:

- action being appealed automatically;
- user statement;
- optional new context;
- submission timestamp.

Do not ask users to reconstruct case IDs manually.

---

# 104. APPEAL WINDOW

Recommended V1:

**30 days**

from enforcement.

Exceptions for certain serious account decisions may be allowed operationally.

---

# 105. APPEAL REVIEWER

Whenever practical, appeal should be reviewed by someone other than the original decision-maker.

---

# 106. APPEAL OUTCOMES

```text
UPHELD

OVERTURNED

MODIFIED

MORE_INFORMATION_REQUIRED
```

---

# 107. APPEAL LIMIT

Recommended V1:

One standard appeal per enforcement action.

Further review only through escalation when:

- material new evidence;
- policy error;
- legal issue.

---

# 108. APPEAL SLA

Suggested initial target:

- suspension appeal: 72 hours;
- permanent-ban appeal: 5 business days.

High-impact legitimate users should not remain incorrectly banned for excessive periods.

---

# 109. MODERATION QUALITY ASSURANCE

T&S QA must evaluate moderator correctness.

Error types:

- false positive;
- false negative;
- wrong policy;
- wrong enforcement;
- procedural error;
- evidence-access violation.

---

# 110. QA SAMPLING

Sample cases from:

- no-action decisions;
- warnings;
- suspensions;
- bans;
- high severity;
- appeals;
- automated enforcement.

Do not QA only bans.

---

# 111. QA TARGET

Establish minimum quality score after sufficient case volume.

Recommended initial operational goal:

**≥95% policy decision accuracy**

Critical-harm cases should target even higher review rigor.

---

# 112. MODERATOR DISAGREEMENT

When two qualified reviewers disagree materially:

- escalate;
- record disagreement;
- identify policy ambiguity.

Frequent disagreement means policy requires clarification.

---

# 113. CALIBRATION

Hold regular calibration sessions using anonymized sample cases.

Objective:

Multiple moderators should reach substantially similar decisions for equivalent cases.

---

# 114. POLICY CHANGE MANAGEMENT

Every policy revision must record:

- version;
- effective date;
- reason;
- impacted categories;
- moderator training requirement.

---

# 115. USER TERMS VERSIONING

When material safety/UGC terms change, determine whether renewed user acknowledgment is necessary.

Store accepted policy version where needed.

---

# 116. MODERATOR TRAINING

Before access moderators must receive training on:

- harassment;
- dating consent;
- threats;
- stalking;
- scams;
- sexual misconduct;
- privacy;
- cultural/language context;
- underage escalation;
- evidence handling;
- appeals;
- bias.

---

# 117. MODERATOR ACCESS CERTIFICATION

A moderator should not gain production access solely because their account was created.

Require training completion and role approval.

---

# 118. MODERATOR WELLNESS

Exposure to abuse and disturbing content creates employee/contractor risk.

Operational program should include:

- rotation;
- breaks;
- escalation support;
- limits on disturbing-content exposure;
- wellness resources.

---

# 119. HIGHLY DISTURBING MATERIAL

Where systems can blur, hide, or abstract graphic evidence without compromising review, use those controls.

Do not unnecessarily expose moderators.

---

# 120. TRUST & SAFETY AUDIT LOGS

Audit:

- report access;
- evidence access;
- enforcement action;
- reversal;
- appeal result;
- staff PII reveal.

---

# 121. EVIDENCE PRESERVATION

When a report is submitted, preserve only evidence relevant to investigation.

Examples:

- selected message IDs;
- photo reference;
- event record;
- relevant profile snapshot.

---

# 122. EVIDENCE SNAPSHOT

For mutable content, preserve an immutable snapshot where necessary.

Example:

Reported bio might later be edited.

Store:

- content hash;
- snapshot reference;
- timestamp.

---

# 123. EVIDENCE CHAIN OF CUSTODY

For critical/legal cases maintain:

- who accessed;
- when;
- what was exported;
- why.

---

# 124. SCREENSHOT EVIDENCE

User-provided screenshots can support context but are not automatically trusted as definitive.

Potential manipulation must be considered.

Prefer native platform evidence where available.

---

# 125. DATA PRESERVATION REQUEST

Legal/safety may place preservation hold on specific records.

Preservation hold must override routine deletion for legally permitted duration.

Access tightly restricted.

---

# 126. LAW-ENFORCEMENT REQUESTS

Do not have frontline moderators casually provide user data to law enforcement.

All formal requests route through designated legal process.

---

# 127. EMERGENCY DISCLOSURE

Any emergency disclosure of user information must follow:

- applicable law;
- documented emergency process;
- authorized personnel;
- audit.

---

# 128. USER DELETION VS SAFETY EVIDENCE

Account deletion does not necessarily destroy legally permitted safety records required to:

- investigate serious misconduct;
- defend against fraud;
- meet legal obligations.

Retained records should be minimized/pseudonymized.

---

# 129. SAFETY DEVICE / ACCOUNT SIGNALS

For severe abuse prevention, maintain privacy-reviewed anti-abuse signals enabling detection of:

- repeated ban evasion;
- automated spam;
- coordinated fake accounts.

Avoid building invasive tracking beyond justified safety need.

---

# 130. SHARED DEVICE / NETWORK CAUTION

Never ban solely because accounts share:

- IP address;
- workplace Wi-Fi;
- apartment network;
- family device pattern.

Require additional signals.

---

# 131. VERIFICATION & SAFETY

Verification means:

> The platform has completed the specified verification process.

It does **not** mean:

> This person is safe.

Never market verification as a safety guarantee.

---

# 132. VERIFIED USER ENFORCEMENT

Verified users receive no safety immunity.

A verified account can still:

- be warned;
- restricted;
- suspended;
- banned.

---

# 133. PREMIUM USER ENFORCEMENT

Premium users receive no preferential moderation.

Revenue must never override:

- safety;
- policy;
- victim protection.

---

# 134. HIGH-VALUE USER / ORGANIZER CASES

Do not quietly exempt:

- popular organizers;
- paying users;
- influencers;
- community leaders.

Sensitive/high-profile cases may require senior review, but policy standard remains consistent.

---

# 135. OFF-PLATFORM CONDUCT

Project Connect generally moderates behavior on its platform.

Off-platform evidence may be considered where it demonstrates serious risk connected to platform relationships, including:

- stalking;
- credible violence;
- sextortion;
- fraud;
- ban evasion.

Do not investigate ordinary off-platform personal disputes.

---

# 136. OFF-PLATFORM REPORT EVIDENCE

Require credible supporting information.

Moderator should document why off-platform behavior materially affects platform safety.

---

# 137. DATING SAFETY CONTROLS

Dating mode requires:

- explicit opt-in;
- mutual compatibility;
- request-based contact;
- block/report;
- approximate location only.

Recommended future additions:

- date check-in;
- trusted contact sharing;
- video verification.

Not required V1.

---

# 138. DATING REJECTION SAFETY

Repeated romantic requests following decline should be prevented through:

- cooldown;
- suppression;
- spam detection.

---

# 139. EXTERNAL LINK SAFETY

Before mutual connection, restrict external URLs.

After connection:

allow cautiously, while automated scam detection may flag suspicious patterns.

---

# 140. QR CODE POLICY

Profile photos containing QR codes should be rejected.

Purpose:

Prevent bypassing:

- consent;
- moderation;
- spam controls.

---

# 141. USERNAME / BIO CONTACT INFO

V1 should detect public:

- phone numbers;
- email addresses;
- Telegram handles;
- external URLs

and either block or moderate according to policy.

---

# 142. IDENTITY DOCUMENTS

Users must not upload identity documents into ordinary:

- profile photos;
- chat;
- support messages

unless routed through authorized verification workflow.

---

# 143. SAFETY NOTIFICATIONS

Examples:

### Scam Warning

If relevant behavior detected:

> Be cautious if someone asks for money, cryptocurrency, gift cards, passwords, or verification codes.

### Public Meeting Reminder

Before dating event/first-meet context:

> For a first meeting, choose a public place and arrange your own transportation.

---

# 144. SAFETY NUDGES MUST BE CONTEXTUAL

Do not flood users with generic warnings.

Trigger when relevant to:

- dating;
- financial solicitation;
- event attendance;
- contact sharing.

---

# 145. MODERATION DASHBOARD

Dashboard should show:

- open cases;
- S4 cases;
- overdue cases;
- SLA risk;
- cases by policy;
- action distribution;
- repeat offenders;
- appeal rate.

---

# 146. SAFETY METRICS

Core:

```text
Reports per 1,000 MAU

Reports per 1,000 connections

Blocks per 1,000 connections

Reports per 1,000 messages

Median time to first review

Median time to resolution

S4 response time

Enforcement rate

Appeal rate

Appeal overturn rate

Repeat-offender rate
```

---

# 147. SAFETY FUNNEL

```text
Interaction
 ↓
Report
 ↓
Triage
 ↓
Policy Violation Confirmed
 ↓
Enforcement
 ↓
Appeal
 ↓
Final Decision
```

Analyze losses at each stage.

---

# 148. REPORT RATE INTERPRETATION

Higher report rate does not always mean platform became less safe.

It may mean:

- reporting became easier;
- users trust reporting more;
- detection improved.

Use multiple metrics together.

---

# 149. BLOCK RATE INTERPRETATION

A rising block rate could indicate:

- harassment increase;
- product discovery mismatch;
- better use of safety tools.

Segment by connection reason and mode.

---

# 150. DATING SAFETY METRICS

Track:

- report rate by dating connections;
- block rate after romantic request;
- sexual harassment reports;
- scam rate;
- repeat-contact violations.

Compare against social mode.

---

# 151. EVENT SAFETY METRICS

Track:

- reports/event;
- organizer complaint rate;
- cancellations;
- attendee block/report rates after events;
- serious offline incidents.

---

# 152. TRUST SCORE — DO NOT EXPOSE AS USER RATING

Internal safety risk models are acceptable.

Do not publicly display:

> "Safety Score: 83/100"

This could:

- create false confidence;
- defame users;
- be gamed.

---

# 153. AUTOMATED RISK SCORE

Internal model may combine:

```text
account age
verification
request velocity
acceptance rate
block frequency
report rate
prior actions
device/account risk
```

Use as triage/risk signal.

---

# 154. FAIRNESS REVIEW

Risk models must be evaluated for unintended disparate impact.

Do not treat:

- language;
- nationality;
- regional community;
- immigration assumptions

as proxies for risk.

---

# 155. SAFETY EXPERIMENTS

Any experiment that reduces safety friction requires explicit T&S review.

Examples:

- increasing stranger-contact limits;
- allowing direct DMs;
- reducing verification;
- exposing more location precision.

---

# 156. KILL SWITCHES

Feature flags required for rapid disabling of:

- dating;
- image messaging;
- attendee discovery;
- public event publishing;
- connection requests.

---

# 157. SAFETY INCIDENT MANAGEMENT

A platform-level incident is different from an individual report.

Examples:

- scam campaign;
- mass spam;
- coordinated harassment;
- data exposure;
- widespread fake accounts.

---

# 158. INCIDENT SEVERITY

```text
SEV-1 — Critical platform/user safety incident

SEV-2 — Major safety degradation

SEV-3 — Localized safety issue

SEV-4 — Minor operational issue
```

---

# 159. SAFETY INCIDENT COMMAND

For SEV-1/SEV-2 designate:

- Incident Lead;
- Engineering Lead;
- T&S Lead;
- Legal contact;
- Communications owner if needed.

---

# 160. INCIDENT RESPONSE

```text
Detect
 ↓
Contain
 ↓
Assess Impact
 ↓
Preserve Evidence
 ↓
Remediate
 ↓
Communicate
 ↓
Postmortem
```

---

# 161. SAFETY POSTMORTEM

Required for serious incidents.

Must answer:

- what happened;
- how detected;
- why controls failed;
- user impact;
- containment;
- permanent corrective actions;
- owner/due date.

Blameless engineering culture does not mean lack of accountability.

---

# 162. TRANSPARENCY

As platform matures, publish periodic safety transparency metrics.

Potential:

- reports received;
- accounts actioned;
- violation categories;
- appeals;
- restoration rates.

Do not expose victim identities.

---

# 163. COMMUNITY GUIDELINES STRUCTURE

Public guidelines should be understandable.

Recommended sections:

1. Be Respectful
2. Respect Consent
3. Be Authentic
4. Keep People Safe
5. No Harassment
6. No Sexual Abuse
7. No Scams
8. Protect Privacy
9. Adults Only
10. Report Concerns

---

# 164. POLICY LANGUAGE

Avoid legalistic-only safety language.

Example:

Better:

> Don't keep contacting someone who has asked you to stop.

than:

> Persistent unwanted communication constituting harassment is prohibited.

Detailed legal/policy definition can exist internally.

---

# 165. FIRST-VIOLATION EDUCATION

For minor mistakes, explain:

- what happened;
- why it matters;
- how to comply.

Goal is safer behavior, not punishment for its own sake.

---

# 166. SEVERE VIOLATIONS

Education-first does not apply to:

- severe violence;
- exploitation;
- sextortion;
- credible predatory conduct.

Protect users first.

---

# 167. ENFORCEMENT CONSISTENCY

Similar facts should produce similar outcomes.

Moderator discretion exists for context, but unexplained inconsistency undermines trust.

---

# 168. POLICY EXCEPTION

Any exceptional override requires:

- senior authority;
- documented justification;
- audit.

---

# 169. MODERATION BIAS CONTROL

Case view should avoid unnecessary information that can bias reviewers.

Where not relevant, moderators do not need:

- subscription tier;
- financial value;
- popularity.

---

# 170. APPEAL QUALITY METRIC

Track:

```text
appeals submitted
appeals upheld
appeals overturned
appeals modified
time to appeal decision
```

High overturn rate signals upstream moderation problem.

---

# 171. REPORTER FEEDBACK

Reporter may receive:

> Thanks. We reviewed your report and took action consistent with our policies.

Avoid revealing confidential enforcement details unnecessarily.

---

# 172. NO-ACTION REPORT FEEDBACK

Possible:

> We reviewed your report. Based on the information available, we did not take action at this time. You can still block this person at any time.

Do not imply report was false.

---

# 173. SAFETY SUPPORT VS MODERATION

Separate:

**Report misconduct**

from:

**Contact customer support**

Critical reports should not become ordinary support tickets.

---

# 174. SAFETY HELP ESCALATION

Support agent who receives:

- threat;
- stalking;
- underage allegation;
- sextortion;
- violence report

must have one-click escalation into T&S queue.

---

# 175. APP STORE SAFETY READINESS

Before submitting app:

Confirm:

- block works;
- report works;
- objectionable content filtering exists;
- moderation queue operational;
- support contact is published;
- community rules accessible.

---

# 176. NO RANDOM ANONYMOUS CHAT

V1 must not introduce anonymous Chatroulette-style interactions.

All communication derives from identifiable account + consent-based connection.

---

# 177. SAFETY QA — BLOCK

Required tests:

- block immediately prevents messaging;
- blocked user disappears from discovery;
- old deep links fail safely;
- pending request invalidated;
- notification suppressed;
- unblock does not reconnect.

---

# 178. SAFETY QA — REPORT

Test:

- every report entry point;
- evidence attached correctly;
- reporter hidden from subject;
- high-severity routing;
- duplicate submissions handled;
- no sensitive evidence leaks.

---

# 179. SAFETY QA — SUSPENSION

Suspended user:

- cannot discover;
- cannot connect;
- cannot message;
- cannot RSVP;
- can access appeal/support where policy allows.

Direct API attempts must fail.

---

# 180. SAFETY QA — BAN

Test:

- existing session restricted;
- push behavior;
- API denial;
- profile removed;
- conversations protected;
- appeal route available if eligible.

---

# 181. SAFETY QA — DATING

Test:

- dating-disabled user never appears;
- opt-out immediate;
- block precedence;
- invalid romantic request rejected;
- social mode does not expose dating preference.

---

# 182. SAFETY QA — PRIVACY

Verify:

- exact coordinates never public;
- phone/email never public;
- moderation notes never consumer-visible;
- reporter identity protected;
- dating preference private.

---

# 183. MODERATION API SECURITY

Moderation endpoints require:

- strong staff authentication;
- MFA;
- role authorization;
- audit.

Never expose moderation routes through consumer authorization.

---

# 184. SAFETY DATA EXPORT

No moderator should download bulk sensitive report data casually.

Exports require:

- role;
- justification;
- logging;
- secure handling.

---

# 185. DATA RETENTION — SAFETY

Exact duration requires legal review.

Framework:

### Low-level dismissed reports
shorter retention.

### Confirmed enforcement
longer.

### Severe fraud/threat cases
longer legal/safety retention may apply.

### Highly sensitive imagery
minimum necessary retention.

---

# 186. POLICY FOR USER BLOCK LIST

Block relationship remains effective while both accounts exist.

Account deactivation must not accidentally erase safety block state.

---

# 187. REACTIVATED ACCOUNTS

On account reactivation:

- prior blocks remain;
- safety enforcement remains;
- ban/restriction history remains internally.

---

# 188. ACCOUNT DELETION + RE-REGISTRATION

Deletion should not automatically create a mechanism allowing severe banned offenders to reset safety history.

Any retained anti-abuse fingerprint must undergo privacy/legal review.

---

# 189. SAFETY RELEASE GATE

No production launch until:

- report implemented;
- block implemented;
- moderation console functional;
- policy categories loaded;
- high-severity escalation documented;
- moderators trained;
- incident owner assigned;
- privacy controls verified;
- safety analytics operational.

---

# 190. DATING RELEASE GATE

Dating feature remains behind kill switch until:

- dating consent works;
- dating privacy works;
- dating eligibility tested;
- sexual-harassment policy active;
- scam policy active;
- dating reports operational;
- moderators trained.

---

# 191. EVENT RELEASE GATE

Public events require:

- organizer approval process;
- event report feature;
- event cancellation notification;
- RSVP safety/privacy controls.

---

# 192. IMAGE MESSAGING RELEASE GATE

Do not enable image messages until:

- content moderation available;
- report image flow available;
- storage segregation complete;
- explicit-content handling ready;
- evidence handling defined.

---

# 193. VIDEO CALL RELEASE GATE — FUTURE

Before future video calling:

- mutual connection required;
- call consent;
- block during call;
- report call;
- abuse handling;
- call metadata retention policy.

Do not record calls by default.

---

# 194. TRUST & SAFETY STAFFING — EARLY STAGE

At DFW beta scale, moderation can initially be:

- internal;
- small;
- highly trained;
- manually reviewed.

Do not prematurely outsource safety decisions before policies stabilize.

---

# 195. BETA MODERATION APPROACH

First 500–1,000 users:

Review:

- every report manually;
- every permanent ban manually;
- every underage allegation manually;
- every scam allegation manually.

This phase produces valuable policy data.

---

# 196. SAFETY WEEKLY REVIEW

During beta, review weekly:

- report categories;
- blocks;
- repeated offenders;
- moderation errors;
- unusual abuse patterns;
- event incidents;
- dating-specific reports.

---

# 197. POLICY DEVELOPMENT LOOP

```text
User Behavior
 ↓
Reports
 ↓
Moderation Experience
 ↓
Policy Gap
 ↓
Policy Update
 ↓
Moderator Training
 ↓
Product Control
```

---

# 198. PRODUCT SAFETY LOOP

Example:

If many women block users after receiving identical connection intros:

Do not solve only with more moderators.

Product may need:

- stronger request limits;
- template detection;
- better intent matching.

---

# 199. SAFETY BY DESIGN

Trust & Safety findings should change product design.

Moderation alone is not the solution to systemic abuse.

---

# 200. NORTH STAR SAFETY OUTCOME

The platform should seek:

> **High rates of meaningful connection with low rates of unwanted interaction.**

This combines product success and safety.

---

# 201. CORE SAFETY KPI PAIR

Track together:

```text
Meaningful Connection Rate
vs
Block/Report Rate
```

A feature increasing connection but dramatically increasing harassment is not successful.

---

# 202. SAFETY RISK REVIEW FOR EVERY NEW FEATURE

Before release ask:

1. How can this feature be abused?
2. Who can be harmed?
3. Can the user stop interaction?
4. Can the user report it?
5. Can moderators investigate it?
6. What evidence exists?
7. Does it reveal more location?
8. Does it bypass consent?
9. Does it enable spam?
10. Is a kill switch available?

---

# 203. V1 SAFETY POLICY DECISIONS NOW FROZEN

The following are mandatory:

1. 18+ only.
2. No anonymous chat.
3. No stranger direct messaging.
4. Dating requires explicit opt-in.
5. Block acts immediately.
6. Report accessible in-app.
7. Reporter identity confidential.
8. Exact user location private.
9. Safety features free.
10. Public explicit sexual content prohibited.
11. Unsolicited explicit sexual communication prohibited.
12. Sextortion is critical severity.
13. Child exploitation concerns receive special escalation.
14. Serious threats receive urgent review.
15. Premium users receive no moderation preference.
16. Organizer status provides no safety exemption.
17. Permanent bans are appealable unless legal/safety exception applies.
18. Moderators receive scoped evidence only.
19. Safety actions are audited.
20. Automated models assist rather than replace accountable moderation for consequential cases.

---

# 204. FUTURE POLICY DECISIONS REQUIRING FORMAL APPROVAL

Do not let engineering decide independently:

- exact message scanning scope;
- automated nudity scanning in private messages;
- government-ID verification;
- location-sharing features;
- safety check-in features;
- call recording;
- video moderation;
- public communities;
- user-created events;
- background checks;
- offender screening;
- emergency disclosure protocol details.

---

# 205. CLAUDE CODE TRUST & SAFETY RULES

Claude Code must not:

- remove block checks;
- bypass report flow;
- expose reporter identity;
- expose moderation notes;
- expose precise location;
- allow direct stranger messaging;
- weaken dating consent;
- make safety premium;
- auto-ban on weak model score alone;
- grant moderators unrestricted chat access;
- persist raw harmful content unnecessarily;
- turn on image/video features without required safety gates.

Any code affecting safety requires references to:

- policy category;
- business rule;
- authorization rule;
- QA case.

---

# 206. SAFETY DEFINITION OF DONE

A feature involving user-to-user interaction is not complete until:

1. Abuse cases identified.
2. Eligibility defined.
3. Block behavior defined.
4. Report behavior defined.
5. Moderation evidence defined.
6. Privacy reviewed.
7. Rate limits defined.
8. Kill switch exists where high-risk.
9. Negative tests exist.
10. Analytics exist.
11. Operational response exists.

---

# 207. FINAL TRUST & SAFETY POSITION

Project Connect must be designed around this principle:

> **Trust is created before connection, consent governs interaction, and safety controls remain available throughout the relationship.**

The platform must not assume:

> verified = safe

or:

> dating opt-in = sexual consent

or:

> premium = privileged

or:

> event attendance = contact consent.

Instead:

```text
Verification
provides identity confidence.

Intent
provides context.

Connection acceptance
provides communication consent.

Block
revokes access.

Report
starts investigation.

Moderation
enforces community standards.

Appeal
protects fairness.
```

The operating objective is not simply to remove bad content.

It is to build an environment in which legitimate users feel confident enough to meet new people while abusive users encounter meaningful friction, detection, and enforcement.

---

# 208. NEXT ARTIFACT

The next recommended artifact is:

## **V1 Notification & Communication Matrix**

It should define every transactional and push notification across the platform:

- event trigger;
- recipient;
- channel;
- exact timing;
- push title/body;
- in-app notification;
- deep link;
- preference override behavior;
- security classification;
- deduplication;
- rate limiting;
- quiet-hours behavior;
- retry policy;
- localization;
- analytics;
- failure handling.

After that:

1. Analytics Tracking Specification
2. Design System Specification
3. System Architecture
4. Architecture Decision Records
5. Claude Code Engineering Constitution
6. Implementation Backlog