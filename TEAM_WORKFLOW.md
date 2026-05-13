# Handoff Team Git Workflow

`main` is the stable branch. No one should commit directly to `main`; each team member works on their own branch and opens a pull request back into `main`.

Before starting work, pull the latest `main`:

```sh
git checkout main
git pull origin main
```

Then switch to your team branch and pull the latest version of that branch:

## Chip - Agent Infrastructure

```sh
git checkout chip/agent-infrastructure
git pull origin chip/agent-infrastructure
```

## Isaac - Brand UI

```sh
git checkout isaac/brand-ui
git pull origin isaac/brand-ui
```

## Bobbie - Demo Narrative

```sh
git checkout bobbie/demo-narrative
git pull origin bobbie/demo-narrative
```

Push your branch regularly and open a pull request into `main` when a change is ready. One person should act as merge captain to keep `main` stable and resolve any conflicts.

For buildathon speed, small safe PRs can be merged quickly after the build passes.
