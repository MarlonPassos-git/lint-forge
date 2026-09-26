# Rule Review

Lint Forge helps developers review unconfigured Biome, ESLint and Ruff rules and assign an explicit decision to each one. Each tool has its own route, catalog, filters and saved progress.

## Language

**Rule Decision**:
An explicit severity or enabled/disabled state assigned to one rule during review.
_Avoid_: Choice, value, action

**Off**:
A **Rule Decision** that explicitly disables a rule.
_Avoid_: Ignore, ignored

**Info**:
A **Rule Decision** that reports a rule violation as informational.
_Avoid_: Inf, information

**Warn**:
A **Rule Decision** that reports a rule violation as a warning.
_Avoid_: Warning

**Error**:
A **Rule Decision** that reports a rule violation as an error.

**Pending Rule**:
A rule without an imported explicit configuration or saved **Rule Decision**.
_Avoid_: Remaining rule, undecided rule

**Rule Filter**:
A language category or tool domain that decides which **Pending Rule**s enter the review deck.
_Avoid_: Category, tool, tag

## Relationships

- A **Pending Rule** receives exactly one **Rule Decision** during review
- Biome decisions are **Off**, **Info**, **Warn**, or **Error**; ESLint omits **Info**; Ruff uses **Enable** or **Disable**, because it has no per-rule severity.
- A **Pending Rule** appears in the review deck when one of its **Rule Filter**s is selected

## Example dialogue

> **Dev:** "Does an imported explicit setting leave the rule pending?"
> **Domain expert:** "No. Only a **Pending Rule** needs a new **Rule Decision**."

## Flagged ambiguities

- "inf" was used for **Info** — resolved: **Info** is the canonical Biome severity name.
- "ignored" previously described **Off** — resolved: **Off** is an explicit decision, not an absent decision.
