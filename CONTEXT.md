# Rule Review

Lint Forge helps developers review unconfigured Biome rules and assign an explicit decision to each one.

## Language

**Rule Decision**:
An explicit severity or disabled state assigned to one Biome rule during review.
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
A Biome rule without an imported explicit configuration or saved **Rule Decision**.
_Avoid_: Remaining rule, undecided rule

## Relationships

- A **Pending Rule** receives exactly one **Rule Decision** during review
- A **Rule Decision** is one of **Off**, **Info**, **Warn**, or **Error**

## Example dialogue

> **Dev:** "Does an imported explicit setting leave the rule pending?"
> **Domain expert:** "No. Only a **Pending Rule** needs a new **Rule Decision**."

## Flagged ambiguities

- "inf" was used for **Info** — resolved: **Info** is the canonical Biome severity name.
- "ignored" previously described **Off** — resolved: **Off** is an explicit decision, not an absent decision.
