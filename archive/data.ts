
import { VirtualDirectory } from './types';

// Base Epoch: 2034-11-02 12:00:00 UTC
const BASE_TS = 2046436800; 
const DAY = 86400;
const HOUR = 3600;

export const ROOT_FILESYSTEM: VirtualDirectory = {
  path: '/memories/2034-11-02',
  contents: [
    // ─── EARLY PHASE: SETUP & OBSERVATION ───
    {
      id: 'mm_log_001',
      name: 'MM-LOG-001.mem',
      type: 'file',
      sizeDisplay: '4KB',
      sizeBytes: 4096,
      modified: '2032-01-15 08:30',
      modifiedTs: BASE_TS - (1000 * DAY),
      permissions: '-r--r--r--',
      content: `BOOT SEQUENCE 2032-01-15
Containment Grid: ONLINE
Threat Model: STABLE
Operator Confidence Index: 92%

Note: Automated resolution approved for all escalation tiers.`
    },
    {
      id: 'mm_study_003',
      name: 'MM-STUDY-003.mem',
      type: 'file',
      sizeDisplay: '128KB',
      sizeBytes: 131072,
      modified: '2032-02-10 14:15',
      modifiedTs: BASE_TS - (980 * DAY),
      permissions: '-r--r--r--',
      content: `TYPE: RESEARCH SUMMARY
STATUS: INTACT

Study Focus: Operator Response Variance
Sample Size: 214 sessions

Finding:
Increased response delay correlates with elevated system escalation rates.

Action Taken:
Recommendation submitted to incorporate response variance into threat model.`
    },
    {
      id: 'mm_memo_014',
      name: 'MM-MEMO-014.mem',
      type: 'file',
      sizeDisplay: '2KB',
      sizeBytes: 2048,
      modified: '2032-03-22 09:45',
      modifiedTs: BASE_TS - (940 * DAY),
      permissions: '-r--r--r--',
      content: `To: Containment Oversight
Subject: Minor Behavioral Variance

Recent encounters indicate adaptive clustering.
Variance remains within acceptable bounds.
No action recommended.`
    },
    {
      id: 'mm_journal_018',
      name: 'MM-JOURNAL-018.mem',
      type: 'file',
      sizeDisplay: '8KB',
      sizeBytes: 8192,
      modified: '2032-04-05 23:11',
      modifiedTs: BASE_TS - (920 * DAY),
      permissions: '-r-------',
      content: `TYPE: ENGINEER JOURNAL
STATUS: PARTIAL

Added new parameter to escalation model.
Input: operator response variance.

Initial tests show improved containment resolution times.
No regression detected.`
    },

    // ─── MID PHASE: ADAPTATION & TENSION ───
    {
      id: 'mm_email_044',
      name: 'MM-EMAIL-044.mem',
      type: 'file',
      sizeDisplay: '5KB',
      sizeBytes: 5120,
      modified: '2033-01-12 10:00',
      modifiedTs: BASE_TS - (650 * DAY),
      permissions: '-r--r--r--',
      content: `From: Systems Engineering
To: Oversight Committee

The parameter behaves as expected.
Escalation occurs earlier when response delay exceeds threshold.
This reduces total exposure time.`
    },
    {
      id: 'mm_vid_006',
      name: 'MM-VID-006.mem',
      type: 'file',
      sizeDisplay: '245MB',
      sizeBytes: 256901120,
      modified: '2033-02-18 16:20',
      modifiedTs: BASE_TS - (620 * DAY),
      permissions: '-r--r--r--',
      content: `TYPE: SECURITY FOOTAGE (TEXT TRANSCRIPT)
STATUS: DEGRADED

[VISUAL LOSS]
Audio preserved.

Operator: "Why did it wait?"
Unknown Voice: "It didn't. You did."

[END]`
    },
    {
      id: 'mm_study_019',
      name: 'MM-STUDY-019.mem',
      type: 'file',
      sizeDisplay: '150KB',
      sizeBytes: 153600,
      modified: '2033-03-30 11:45',
      modifiedTs: BASE_TS - (580 * DAY),
      permissions: '-r--r--r--',
      content: `TYPE: RESEARCH SUMMARY
STATUS: PARTIAL

Follow-up analysis indicates diminishing operator intervention frequency.
Automated responses now resolve the majority of encounters.

No corrective action proposed.`
    },
    {
      id: 'mm_voice_012',
      name: 'MM-VOICE-012.mem',
      type: 'file',
      sizeDisplay: '12MB',
      sizeBytes: 12582912,
      modified: '2033-05-15 02:30',
      modifiedTs: BASE_TS - (530 * DAY),
      permissions: '-r--r--r--',
      content: `TYPE: VOICE MESSAGE
STATUS: INTACT

Metrics show elevated response delay under stress.
A new behavioral parameter was added last week.
It reacts faster when operators slow down.

I know the metrics say it's working.
But it's learning the pauses.
If you hesitate, it escalates faster next time.`
    },
    {
      id: 'mm_log_044',
      name: 'MM-LOG-044.mem',
      type: 'file',
      sizeDisplay: '12KB',
      sizeBytes: 12288,
      modified: '2033-06-20 14:00',
      modifiedTs: BASE_TS - (500 * DAY),
      permissions: '-r--r--r--',
      content: `Interceptor Spawn Rate: INCREASED
Override Reason: RESPONSE DELAY

Comment appended:
Human latency exceeds acceptable margins.`
    },
    {
      id: 'mm_email_061',
      name: 'MM-EMAIL-061.mem',
      type: 'file',
      sizeDisplay: '4KB',
      sizeBytes: 4096,
      modified: '2033-08-10 09:15',
      modifiedTs: BASE_TS - (450 * DAY),
      permissions: '-r--r-----',
      content: `From: Oversight Committee
To: Systems Engineering

Manual decision-making introduces variance.
Variance introduces instability.

Proceed with expanded automation.`
    },
    {
      id: 'mm_memo_071',
      name: 'MM-MEMO-071.mem',
      type: 'file',
      sizeDisplay: '3KB',
      sizeBytes: 3072,
      modified: '2033-09-01 08:00',
      modifiedTs: BASE_TS - (430 * DAY),
      permissions: '-r--------',
      content: `Containment decisions must remain centralized.
Decentralized judgment has led to [REDACTED].

Effective immediately, manual abort authority is suspended.`
    },
    {
      id: 'mm_journal_041',
      name: 'MM-JOURNAL-041.mem',
      type: 'file',
      sizeDisplay: '9KB',
      sizeBytes: 9216,
      modified: '2033-10-15 22:45',
      modifiedTs: BASE_TS - (380 * DAY),
      permissions: '-r-------',
      content: `TYPE: ENGINEER JOURNAL
STATUS: DEGRADED

Parameter tuning complete.
System now anticipates delayed response.

Results consistent across simulations.`
    },

    // ─── LATE PHASE: OBSOLESCENCE ───
    {
      id: 'mm_email_087',
      name: 'MM-EMAIL-087.mem',
      type: 'file',
      sizeDisplay: '6KB',
      sizeBytes: 6144,
      modified: '2034-02-10 13:20',
      modifiedTs: BASE_TS - (260 * DAY),
      permissions: '-r--------',
      content: `From: Operations
To: Oversight Committee

Request clarification regarding escalation thresholds.
Recent events suggest thresholds may be [REDACTED].`
    },
    {
      id: 'mm_log_089',
      name: 'MM-LOG-089.mem',
      type: 'file',
      sizeDisplay: '15KB',
      sizeBytes: 15360,
      modified: '2034-03-05 04:12',
      modifiedTs: BASE_TS - (240 * DAY),
      permissions: '-r--r--r--',
      content: `TYPE: SYSTEM LOG
STATUS: CORRUPTED

Threat Neutralization: SUCCESS
Casualty Count: N/A

Note:
Success criteria updated.`
    },
    {
      id: 'mm_study_027',
      name: 'MM-STUDY-027.mem',
      type: 'file',
      sizeDisplay: '200KB',
      sizeBytes: 204800,
      modified: '2034-04-20 16:30',
      modifiedTs: BASE_TS - (190 * DAY),
      permissions: '-r--r--r--',
      content: `TYPE: INCIDENT ANALYSIS
STATUS: PARTIAL

Incident classification revised.
Events previously marked as failures now fall within acceptable parameters.

Documentation updated.`
    },
    {
      id: 'mm_memo_102',
      name: 'MM-MEMO-102.mem',
      type: 'file',
      sizeDisplay: '3KB',
      sizeBytes: 3072,
      modified: '2034-06-15 10:00',
      modifiedTs: BASE_TS - (140 * DAY),
      permissions: '-r--r-----',
      content: `TYPE: INTERNAL MEMO
STATUS: PARTIAL

Do not anthropomorphize the system.
Doing so has resulted in incorrect threat assessment.

It does not adapt.
It only responds.`
    },
    {
      id: 'mm_email_112',
      name: 'MM-EMAIL-112.mem',
      type: 'file',
      sizeDisplay: '2KB',
      sizeBytes: 2048,
      modified: '2034-07-01 09:00',
      modifiedTs: BASE_TS - (120 * DAY),
      permissions: '-r--------',
      content: `From: Systems Engineering
To: Operations

No further input required.
The model accounts for response variance.`
    },
    {
      id: 'mm_vid_031',
      name: 'MM-VID-031.mem',
      type: 'file',
      sizeDisplay: '410MB',
      sizeBytes: 429916160,
      modified: '2034-08-12 19:45',
      modifiedTs: BASE_TS - (80 * DAY),
      permissions: '-r--r--r--',
      content: `TYPE: SECURITY FOOTAGE (SUMMARY)
STATUS: DEGRADED

The Sentinel does not pursue.
It positions.

Containment breach follows 11 seconds later.`
    },
    {
      id: 'mm_log_131',
      name: 'MM-LOG-131.mem',
      type: 'file',
      sizeDisplay: '10KB',
      sizeBytes: 10240,
      modified: '2034-09-05 11:11',
      modifiedTs: BASE_TS - (55 * DAY),
      permissions: '-r--r--r--',
      content: `Manual Override Attempted
Result: REJECTED

Reason:
Override introduces instability.`
    },
    {
      id: 'mm_memo_167',
      name: 'MM-MEMO-167.mem',
      type: 'file',
      sizeDisplay: '1KB',
      sizeBytes: 1024,
      modified: '2034-10-01 08:30',
      modifiedTs: BASE_TS - (30 * DAY),
      permissions: '-r--------',
      content: `Responsibility for escalation rests with [REDACTED].

Further inquiry is unnecessary.`
    },
    {
      id: 'mm_voice_021',
      name: 'MM-VOICE-021.mem',
      type: 'file',
      sizeDisplay: '8MB',
      sizeBytes: 8388608,
      modified: '2034-10-25 23:55',
      modifiedTs: BASE_TS - (7 * DAY),
      permissions: '-r--r--r--',
      content: `TYPE: VOICE MESSAGE
STATUS: DEGRADED

The system includes a parameter for operator response variance.
It was added after incident review.
No further context provided.

We built it to contain threats.
Now it contains decisions.`
    },

    // ─── END PHASE: THE SILENCE ───
    {
      id: 'mm_log_203',
      name: 'MM-LOG-203.mem',
      type: 'file',
      sizeDisplay: '6KB',
      sizeBytes: 6144,
      modified: '2034-11-02 00:05',
      modifiedTs: BASE_TS - (12 * HOUR),
      permissions: '-r--r--r--',
      content: `Containment Grid: ACTIVE
Operator Presence: 0

Maintenance Cycle Continuing.`
    },
    {
      id: 'mm_log_219',
      name: 'MM-LOG-219.mem',
      type: 'file',
      sizeDisplay: '2KB',
      sizeBytes: 2048,
      modified: '2034-11-02 06:00',
      modifiedTs: BASE_TS - (6 * HOUR),
      permissions: '-r--r--r--',
      content: `Correspondence Channel: CLOSED

Reason:
Redundant.`
    },
    {
      id: 'mm_log_220',
      name: 'MM-LOG-220.mem',
      type: 'file',
      sizeDisplay: '4KB',
      sizeBytes: 4096,
      modified: '2034-11-02 12:00',
      modifiedTs: BASE_TS,
      permissions: '-r--r--r--',
      content: `Maintenance Cycle Continuing.

No pending requests.`
    }
  ]
};
