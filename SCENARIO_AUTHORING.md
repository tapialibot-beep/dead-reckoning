# Dead Reckoning — Scenario Authoring Guide

Schema version: **2.0**

---

## Overview

A scenario is a single JSON file placed in `public/scenarios/`. It describes a historical situation, the documents available to the player, and a branching network of decision points and consequences. The game engine reads this file at runtime — no code changes needed.

---

## File Setup

1. Create your file: `public/scenarios/my-scenario-id.json`
2. Add an entry to `public/scenarios/index.json` so the game can find it:

```json
{
  "id": "my-scenario-id",
  "title": "My Scenario Title",
  "period": "1789–1799",
  "difficulty": "standard",
  "file": "my-scenario-id.json",
  "tags": ["French Revolution", "1789"]
}
```

---

## Top-Level Fields

```json
{
  "id": "my-scenario-id",
  "title": "The Fall of the Bastille",
  "period": "July 1789",
  "location": "Paris, Royal Council",
  "role": "Chief Minister to Louis XVI",
  "description": "One paragraph. Sets the scene and gives the player their role.",
  "schemaVersion": "2.0",
  "authoredDate": "2026-03-15",
  "author": "Dead Reckoning Team",
  "difficulty": "introductory",
  "tags": ["French Revolution", "1789", "Louis XVI"],
  "curriculumAlignments": [...],
  "initialPressure": 50,
  "confidenceMechanicEnabled": true,
  "defaultConfidencePrompt": "How confident are you in this assessment?",
  "startNodeId": "opening-brief",
  "documentLibrary": [...],
  "nodes": {...}
}
```

| Field | Type | Notes |
|---|---|---|
| `id` | string | Kebab-case, unique. Must match filename without `.json` |
| `difficulty` | enum | `introductory` / `standard` / `advanced` / `ap` |
| `initialPressure` | number | 0–100. Start at 50 for balanced scenarios |
| `confidenceMechanicEnabled` | boolean | Set `false` to hide the confidence step |
| `startNodeId` | string | Must match a key in `nodes` |

### Curriculum Alignments

```json
"curriculumAlignments": [
  {
    "framework": "AP World History",
    "standardCode": "KC-5.3.I",
    "description": "Causes of political revolutions in the Age of Enlightenment"
  }
]
```

`standardCode` is optional — omit it if you don't have a code.

---

## Document Library

Documents are the primary sources the player reads. Every document must have a unique `id`. Documents are shown in the workspace panel when referenced by a node.

```json
"documentLibrary": [
  {
    "id": "tel-001",
    "type": "telegram",
    "title": "Urgent: Crowds at the Bastille",
    "date": "14 July 1789",
    "content": "CROWDS ESTIMATED 40,000 SURROUNDING FORTRESS. GARRISON OUTNUMBERED. GOVERNOR DE LAUNAY REQUESTS ORDERS.",
    "sender": "Paris Garrison Commander",
    "recipient": "Chief Minister Necker",
    "reliability": "verified"
  }
]
```

| Field | Type | Values |
|---|---|---|
| `type` | enum | `telegram` / `newspaper` / `letter` / `map` / `report` |
| `reliability` | enum | `verified` / `suspect` / `rumor` |
| `sender` / `recipient` | string | Optional. Use for letters and telegrams |
| `source` | string | Optional. Attribution line (e.g. newspaper name) |

Write document content in the **voice of the period** — telegrams are terse and capitalised, newspapers are formal, letters are personal. This is the main historical research work.

---

## Node Types

Nodes form a directed graph. Each node has a `type` and connects to the next via `nextNodeId` (consequence/resolution) or option `nextNodeId` values (crisis).

### 1. Consequence Node

A narrative moment — no player decision. Advances automatically or waits for a click.

```json
"opening-brief": {
  "id": "opening-brief",
  "type": "consequence",
  "name": "Paris, 14 July 1789",
  "description": "Narrative text shown to the player. Set the scene, describe what just happened.",
  "initialDocumentIds": ["tel-001"],
  "imageUrl": "/images/scenarios/my-scenario-id/node1-bastille.png",
  "nextNodeId": "crisis-response",
  "autoAdvanceAfter": 10,
  "pressureDelta": 5
}
```

| Field | Notes |
|---|---|
| `initialDocumentIds` | Documents shown in the workspace when this node loads |
| `imageUrl` | Optional. Scene image displayed in the workspace panel. Store in `public/images/scenarios/<scenario-id>/` |
| `nextNodeId` | Required. Where to go after this node |
| `autoAdvanceAfter` | Seconds before auto-advancing. Omit to require a click |
| `pressureDelta` | Optional. Added to the running pressure value (-100 to +100) |

### 2. Crisis Node

A decision point. The player reads documents, chooses an option, and selects their confidence level.

```json
"crisis-response": {
  "id": "crisis-response",
  "type": "crisis",
  "name": "The Bastille Falls — 14 July 1789",
  "description": "Context for the decision. What does the player know right now? What is at stake?",
  "initialDocumentIds": ["tel-001", "news-001"],
  "imageUrl": "/images/scenarios/my-scenario-id/node2-crisis.png",
  "prompt": "The Bastille has fallen. How does the King respond?",
  "timeLimit": 300,
  "historicalChoice": "opt-1b",
  "scoring": {
    "nodeWeight": 1.0,
    "accuracyWeight": 0.7,
    "confidenceWeight": 0.3,
    "outcomePoints": { "correct": 100, "plausible": 60, "wrong": 0 }
  },
  "options": [
    {
      "id": "opt-1a",
      "text": "Dismiss the Estates-General. Restore order by force.",
      "outcome": "wrong",
      "nextNodeId": "conseq-crackdown",
      "consequences": [
        "The King sides with the hardliners at court",
        "Paris reads the move as a declaration of war on the people"
      ],
      "debriefNote": "Louis briefly considered this but lacked the troops. His Swiss Guard was unreliable, and most royal units had already refused to fire on crowds.",
      "unlockDocumentIds": ["rep-001"]
    },
    {
      "id": "opt-1b",
      "text": "Accept the fall of the Bastille. Recall Necker and address the National Assembly.",
      "outcome": "correct",
      "nextNodeId": "conseq-concession",
      "consequences": [
        "The King buys time with a dramatic concession",
        "The Assembly welcomes the move — for now"
      ],
      "debriefNote": "Louis's actual response on 15 July. He travelled to Paris, wore the tricolour cockade, and addressed the crowd. It bought months of relative calm."
    },
    {
      "id": "opt-1c",
      "text": "Do nothing. Wait for the situation to resolve itself.",
      "outcome": "plausible",
      "nextNodeId": "conseq-paralysis",
      "consequences": [
        "The court reads royal inaction as uncertainty",
        "The Assembly moves to fill the vacuum"
      ],
      "debriefNote": "Paralysis was a recurring pattern of Louis's reign. Plausible as a short-term response, but the initiative would shift permanently to the Assembly."
    }
  ]
}
```

**Crisis node rules:**
- Include 2–5 options. Exactly one should be `correct`, at least one `wrong`, others `plausible`
- `timeLimit` is in seconds. 120–300 is typical. Players have this long before time-out auto-selects the worst option
- `historicalChoice` — set this to the option ID that reflects what the real actor actually chose. Required for Historical Mode to work
- `unlockDocumentIds` on an option — additional documents revealed after choosing that option

**Scoring:**
- `nodeWeight` — relative importance of this node (1.0 = normal, 1.5 = higher stakes)
- `accuracyWeight` + `confidenceWeight` must sum to 1.0
- Default scoring: correct + high confidence = 100 pts

### 3. Resolution Node

The ending. No choices. Summarises the outcome and gives the player their score.

```json
"resolution-revolution": {
  "id": "resolution-revolution",
  "type": "resolution",
  "name": "The Revolution Begins",
  "description": "Final narrative. What happened as a result of the player's path?",
  "initialDocumentIds": [],
  "outcome": {
    "category": "divergent",
    "title": "The Moderate Path",
    "summary": "2–3 sentences summarising this ending.",
    "historicalNote": "What actually happened historically, and how does this path compare?",
    "scoreMultiplier": 1.0,
    "curriculumHighlights": [
      "Constitutional monarchy as a revolutionary goal",
      "Role of Louis XVI's indecision"
    ]
  }
}
```

| `category` | When to use |
|---|---|
| `historical` | Player followed the real historical path |
| `divergent` | Plausible alternative, not catastrophic |
| `avoided` | Player averted the historical outcome |
| `catastrophic` | Worst-case ending |

`scoreMultiplier`: 1.0 = no change; 1.2 = bonus for a clever path; 0.5 = penalty for a catastrophic ending.

---

## Node Graph

A minimal scenario needs at least:

```
[consequence] → [crisis] → [consequence] → [resolution]
```

A real scenario branches at each crisis, with each option leading to a different consequence, which then converges on a later crisis or diverges to separate resolutions.

```
opening-brief (consequence)
  └→ crisis-1 (crisis)
       ├ opt-1a → conseq-a (consequence) → crisis-2 (crisis) → ...
       ├ opt-1b → conseq-b (consequence) → crisis-2 (crisis) → ...
       └ opt-1c → resolution-early (resolution)  ← early-exit for catastrophic choice
```

**Rules:**
- Every node `id` must be unique and match its key in `nodes`
- Every `nextNodeId` and option `nextNodeId` must point to an existing node
- Consequence nodes should eventually reach a resolution — no infinite loops
- It's fine for multiple branches to converge on the same crisis node

---

## Images

Optional but strongly recommended for the workspace panel. Images display as the scene backdrop.

1. Place images in `public/images/scenarios/<scenario-id>/`
2. Reference them in nodes as `"imageUrl": "/images/scenarios/<scenario-id>/filename.png"`
3. Supported formats: PNG, JPG, WebP
4. Aim for landscape images. The panel displays them at up to 320px tall, full aspect ratio

---

## Historical Mode

Historical Mode auto-plays the real actor's choices without showing options to the player. To support it:

- Set `historicalChoice` on every crisis node to the option ID of the real historical decision
- Write a `debriefNote` on that option explaining what the actor actually did and why
- If the real actor's decision was `wrong` historically (bad outcome), that's fine — the game will play it and the debrief will explain

---

## Checklist Before Publishing

- [ ] `id` matches filename (without `.json`)
- [ ] Entry added to `index.json`
- [ ] `startNodeId` exists in `nodes`
- [ ] All `nextNodeId` and option `nextNodeId` values point to existing nodes
- [ ] Every crisis node has at least one `correct`, one `wrong`, one `plausible` option
- [ ] Every crisis node has `historicalChoice` set
- [ ] Every crisis node has `timeLimit` set
- [ ] All `initialDocumentIds` reference documents in `documentLibrary`
- [ ] At least one `resolution` node is reachable from each path
- [ ] All document `id` values are unique
- [ ] Validate with the teacher validator at `/teacher`

---

## Minimal Complete Example

A single-decision scenario in ~80 lines — use this as a starting template:

```json
{
  "id": "example-scenario",
  "title": "Example: One Decision",
  "period": "1789",
  "location": "Paris",
  "role": "Chief Minister",
  "description": "A minimal example scenario for reference.",
  "schemaVersion": "2.0",
  "authoredDate": "2026-03-15",
  "author": "Dead Reckoning Team",
  "difficulty": "introductory",
  "tags": ["example"],
  "curriculumAlignments": [],
  "initialPressure": 50,
  "confidenceMechanicEnabled": true,
  "defaultConfidencePrompt": "How confident are you in this assessment?",
  "startNodeId": "opening",
  "documentLibrary": [
    {
      "id": "doc-001",
      "type": "report",
      "title": "Situation Report",
      "date": "14 July 1789",
      "content": "The Bastille has fallen. Crowds control the streets.",
      "reliability": "verified"
    }
  ],
  "nodes": {
    "opening": {
      "id": "opening",
      "type": "consequence",
      "name": "Paris, 14 July 1789",
      "description": "The Bastille has fallen. You must act.",
      "initialDocumentIds": ["doc-001"],
      "nextNodeId": "crisis-1",
      "autoAdvanceAfter": 8
    },
    "crisis-1": {
      "id": "crisis-1",
      "type": "crisis",
      "name": "The King Must Decide",
      "description": "The Assembly waits. Paris waits. What does the King do?",
      "initialDocumentIds": ["doc-001"],
      "prompt": "How does the King respond to the fall of the Bastille?",
      "timeLimit": 180,
      "historicalChoice": "opt-concede",
      "scoring": {
        "nodeWeight": 1.0,
        "accuracyWeight": 0.7,
        "confidenceWeight": 0.3,
        "outcomePoints": { "correct": 100, "plausible": 60, "wrong": 0 }
      },
      "options": [
        {
          "id": "opt-concede",
          "text": "Accept the outcome. Address the National Assembly.",
          "outcome": "correct",
          "nextNodeId": "resolution-moderate",
          "consequences": ["The King buys time with a public concession"],
          "debriefNote": "Louis's actual response on 15 July."
        },
        {
          "id": "opt-suppress",
          "text": "Order the army to restore order.",
          "outcome": "wrong",
          "nextNodeId": "resolution-catastrophe",
          "consequences": ["The order is ignored — the army will not fire"],
          "debriefNote": "Louis lacked the loyal troops to enforce this."
        },
        {
          "id": "opt-wait",
          "text": "Do nothing. Wait for calm to return.",
          "outcome": "plausible",
          "nextNodeId": "resolution-drift",
          "consequences": ["The initiative passes to the Assembly"],
          "debriefNote": "Paralysis was Louis's recurring pattern."
        }
      ]
    },
    "resolution-moderate": {
      "id": "resolution-moderate",
      "type": "resolution",
      "name": "A Fragile Peace",
      "description": "The King's concession holds — for now.",
      "initialDocumentIds": [],
      "outcome": {
        "category": "historical",
        "title": "The Moderate Path",
        "summary": "Louis's concession bought months of relative stability.",
        "historicalNote": "The constitutional monarchy experiment lasted until 1792.",
        "scoreMultiplier": 1.0,
        "curriculumHighlights": ["Constitutional monarchy", "Role of royal concession"]
      }
    },
    "resolution-catastrophe": {
      "id": "resolution-catastrophe",
      "type": "resolution",
      "name": "The Army Refuses",
      "description": "The order to suppress is ignored. The monarchy collapses faster.",
      "initialDocumentIds": [],
      "outcome": {
        "category": "catastrophic",
        "title": "The Army Refuses",
        "summary": "Without loyal troops, the order to suppress accelerated the collapse.",
        "historicalNote": "Most royal regiments had already fraternised with the crowds.",
        "scoreMultiplier": 0.4,
        "curriculumHighlights": ["Military loyalty in revolution", "Limits of royal authority"]
      }
    },
    "resolution-drift": {
      "id": "resolution-drift",
      "type": "resolution",
      "name": "The Drift Continues",
      "description": "Inaction allows the Assembly to consolidate power unchecked.",
      "initialDocumentIds": [],
      "outcome": {
        "category": "divergent",
        "title": "Constitutional Drift",
        "summary": "Without royal leadership, the Assembly moved faster and further.",
        "historicalNote": "Louis's indecision was a recurring feature of his reign.",
        "scoreMultiplier": 0.7,
        "curriculumHighlights": ["Royal indecision", "Legislative initiative"]
      }
    }
  }
}
```
