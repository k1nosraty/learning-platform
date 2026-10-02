---
schemaVersion: '1.0'
title: Infrastructure learning sample
description: Four required units and one optional exercise.
language: en
nodes:
- id: fundamentals
  kind: stage
  parentId: null
  order: 0
  title: Infrastructure fundamentals
  body: '# Infrastructure fundamentals


    Work in an isolated lab.

    '
  estimatedMinutes: null
  difficulty: null
  tags: []
  completion: null
  resourceUrl: null
- id: networking
  kind: module
  parentId: fundamentals
  order: 0
  title: Networking
  body: '# Networking


    Understand addressing and diagnostics.

    '
  estimatedMinutes: null
  difficulty: null
  tags: []
  completion: null
  resourceUrl: null
- id: ip-basics
  kind: lesson
  parentId: networking
  order: 0
  title: Addressing and diagnostics
  body: '# Addressing and diagnostics


    Read the tasks below. Reading alone does not complete this lesson.

    '
  estimatedMinutes: null
  difficulty: null
  tags: []
  completion: null
  resourceUrl: null
- id: inspect-config
  kind: task
  parentId: ip-basics
  order: 0
  title: Inspect configuration
  body: '# Inspect configuration


    Record your lab IP address and explain the subnet mask.

    '
  estimatedMinutes: null
  difficulty: null
  tags: []
  completion:
    required: true
    rule: self
  resourceUrl: null
- id: test-connectivity
  kind: task
  parentId: ip-basics
  order: 1
  title: Test connectivity
  body: '# Test connectivity


    Test connectivity inside the lab and record the result.

    '
  estimatedMinutes: null
  difficulty: null
  tags: []
  completion:
    required: true
    rule: self
  resourceUrl: null
- id: packet-exercise
  kind: exercise
  parentId: ip-basics
  order: 2
  title: Optional packet exercise
  body: '# Optional packet exercise


    Analyze a synthetic packet capture.

    '
  estimatedMinutes: null
  difficulty: null
  tags: []
  completion:
    required: false
    rule: self
  resourceUrl: null
- id: work-safety
  kind: lesson
  parentId: fundamentals
  order: 1
  title: Lab safety and documentation
  body: '# Lab safety and documentation


    Use synthetic accounts, isolated resources and clear notes. Confirm after reading.

    '
  estimatedMinutes: null
  difficulty: null
  tags: []
  completion:
    required: true
    rule: self
  resourceUrl: null
- id: network-lab
  kind: project
  parentId: fundamentals
  order: 2
  title: Small network lab
  body: '# Small network lab


    Submit a diagram and connectivity evidence. An authorized reviewer approves this
    project in organization mode.

    '
  estimatedMinutes: null
  difficulty: null
  tags: []
  completion:
    required: true
    rule: approval
  resourceUrl: null
---

# Infrastructure learning sample

Four required units and one optional exercise.

- [Infrastructure fundamentals](modules/fundamentals.md) — stage
- [Networking](modules/networking.md) — module
- [Addressing and diagnostics](modules/ip-basics.md) — lesson
- [Inspect configuration](modules/inspect-config.md) — task
- [Test connectivity](modules/test-connectivity.md) — task
- [Optional packet exercise](modules/packet-exercise.md) — exercise
- [Lab safety and documentation](modules/work-safety.md) — lesson
- [Small network lab](projects/network-lab.md) — project

The roadmap.yml manifest is authoritative. This README is an overview, not another tracked lesson.
