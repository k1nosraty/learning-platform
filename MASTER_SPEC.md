# MASTER PROJECT PROMPT

## Build a Commercial Multi-Tenant Learning Path, Training, Onboarding & Progress Management SaaS

Design and implement a production-grade web application that can eventually become a commercial SaaS product.

This must NOT be designed merely as a personal learning tracker.

The platform should be generic enough to support:

- Individual learners
- Interns
- Employees
- New-hire onboarding
- Corporate training
- Technical training
- Bootcamps
- Mentorship programs
- Universities and educational teams
- Certification preparation
- Internal company learning paths
- Skill-development programs
- Project-based training
- Compliance-oriented training
- Any structured roadmap where people must complete content, tasks, exercises, assessments, or projects

The central concept is:

> Organizations create structured learning paths, assign them to people or teams, monitor progress, collect evidence of work, communicate with learners, and generate professional reports.

The application must be generic.

It must NEVER contain hardcoded knowledge about a particular profession, technology, company, or learning path.

---

# 1. Product Vision

Think of this product as a combination of:

Learning Roadmap Manager

+

Training Management System

+

Employee Onboarding Platform

+

Progress Tracker

+

Markdown Knowledge Base

+

Assignment / Project Management

+

Learning Analytics

+

Reporting Platform

The product should feel professional enough that a company could eventually pay for it.

Do NOT design it as a hobby project.

Architect it as a real SaaS product.

---

# 2. Fundamental Architecture

The system should have four major conceptual layers:

## Platform Engine

Responsible for:

- authentication
- organizations
- teams
- permissions
- content rendering
- assignments
- progress
- analytics
- reports
- notifications
- comments
- submissions
- activity tracking

## Content Engine

Responsible for:

- learning paths
- modules
- lessons
- tasks
- exercises
- projects
- assessments
- resources
- prerequisites

## Collaboration Layer

Responsible for:

- managers
- mentors
- learners
- feedback
- comments
- submissions
- reviews
- approvals

## Analytics Layer

Responsible for:

- progress
- learning activity
- completion statistics
- study time
- reports
- organization analytics

Keep these concerns separated.

---

# 3. Multi-Tenant SaaS Architecture

The application must support multiple independent organizations.

Example:

Organization A
    Users
    Teams
    Learning Paths
    Reports
    Settings

Organization B
    Users
    Teams
    Learning Paths
    Reports
    Settings

Data belonging to one organization must never be visible to another organization.

Design strict tenant isolation from the beginning.

Every relevant database record must be scoped appropriately.

Do not bolt multi-tenancy onto the system later.

---

# 4. User Roles

Implement a flexible RBAC permission system.

Initial roles:

## Platform Owner

Manages the entire SaaS.

Can:

- manage organizations
- inspect platform usage
- manage plans
- manage platform settings
- manage global templates
- view system health

## Organization Owner

Owns a company/workspace.

Can:

- manage organization
- invite users
- manage teams
- create learning paths
- assign paths
- view organization reports
- manage organization settings

## Admin

Can manage users, content, assignments, and reports according to permissions.

## Manager

Can:

- assign paths
- monitor learners
- view reports
- review submissions
- provide feedback

## Mentor

Can:

- monitor assigned learners
- review work
- comment
- approve tasks/projects
- provide feedback

## Content Creator

Can:

- create learning paths
- edit content
- create exercises
- create projects
- manage resources

## Learner

Can:

- access assigned paths
- complete lessons
- complete tasks
- submit work
- write notes
- record study sessions
- view personal analytics
- generate personal reports

Do not hardcode authorization checks throughout UI components.

Implement centralized permissions.

Design the RBAC model so custom roles can eventually be added.

---

# 5. Organizations and Workspaces

Each organization should have a workspace.

Example:

Acme Corporation

Dashboard

People

Teams

Learning Paths

Assignments

Submissions

Reports

Analytics

Content Library

Settings

The organization dashboard should show:

Active learners

Active learning paths

Completion rates

Recent activity

Pending reviews

Overdue assignments

Recently completed paths

Study activity

Team progress

---

# 6. Teams

Organizations can create teams.

Examples:

IT Interns

Backend Developers

Network Engineers

New Employees

DevOps Team

Summer Internship 2027

Users may belong to one or more teams.

Learning paths can be assigned to:

individual users

teams

cohorts

---

# 7. Cohorts

Support training cohorts.

Example:

Summer Internship 2027

Start Date:
June 1

End Date:
August 31

Members:
15 interns

Assigned Paths:
IT Infrastructure Fundamentals
Internal Company Onboarding

Managers should be able to compare progress across a cohort without turning the product into a competitive leaderboard by default.

---

# 8. Learning Path

The core entity is:

Learning Path

Examples:

Junior Network Engineer

New Employee Onboarding

Backend Developer Roadmap

SQL Server Administrator

Cybersecurity Fundamentals

Sales Employee Onboarding

HR Training

A learning path contains:

Stages

Modules

Lessons

Tasks

Exercises

Assessments

Projects

Resources

Milestones

Prerequisites

---

# 9. Hierarchical Content Model

Use a flexible hierarchy.

Example:

Learning Path

Stage

Module

Lesson

Task

Exercise

Project

Assessment

Resource

Avoid unnecessary rigidity.

Some paths may not use stages.

Some modules may contain projects.

Some lessons may contain only tasks.

The content engine must support different training structures.

---

# 10. Markdown-First Content Engine

One of the defining features of the platform is Markdown-first content.

Learning content should be importable/exportable as normal Markdown files.

Example:

---
id: tcp-ip-fundamentals
type: lesson
title: TCP/IP Fundamentals
order: 2
difficulty: beginner
estimated_minutes: 180
tags:
  - networking
  - tcp-ip
---

# TCP/IP Fundamentals

## Objectives

Understand TCP/IP fundamentals.

## Tasks

- [ ] Understand IPv4 addressing
- [ ] Compare TCP and UDP
- [ ] Inspect network configuration
- [ ] Capture packets using Wireshark

## Exercise

Analyze network traffic.

## Resources

...

Markdown must remain human-readable outside the application.

---

# 11. Content Independence

The platform must NOT require code changes when users:

create learning paths

create modules

create lessons

reorder content

add tasks

add exercises

add projects

change prerequisites

add resources

remove content

rename content

The application must interpret generic content structures.

---

# 12. Visual Content Editor

Markdown cannot be the only editing experience.

Non-technical managers must be able to create training content through the web UI.

Build a professional editor supporting:

Headings

Text

Lists

Task lists

Code blocks

Tables

Images

Links

Callouts

Resources

Exercises

Projects

Assessments

Embedded content

The editor should support:

Visual mode

Markdown mode

Preview mode

The underlying content model should remain compatible with Markdown import/export.

---

# 13. Learning Path Builder

Build a visual path builder.

Example:

Junior IT Technician

[Stage 1 — Fundamentals]
    Networking Basics
    Windows Basics

[Stage 2 — Infrastructure]
    Windows Server
    Active Directory
    VMware

[Stage 3 — Operations]
    Backup
    Monitoring

[Final Project]
    Build a Company Infrastructure Lab

Allow drag-and-drop reordering.

Allow:

Add Stage

Add Module

Add Lesson

Add Exercise

Add Project

Add Assessment

Add Milestone

Configure prerequisites.

---

# 14. Learning Path Templates

Organizations should be able to create reusable templates.

Example:

Template:
Junior IT Employee Onboarding

Then create:

Ali's Path

Sara's Path

John's Path

without duplicating content unnecessarily.

Use versioned templates.

---

# 15. Versioning

Learning paths will evolve.

Version content.

Example:

Network Engineer Roadmap
Version 1

Network Engineer Roadmap
Version 2

Existing learners should not suddenly lose progress because the template changed.

Assignments should reference an appropriate path version or snapshot.

Design this carefully.

---

# 16. Assignments

Managers can assign:

Learning Paths

Modules

Lessons

Exercises

Projects

Assessments

Assignments may have:

Assignee

Assigned By

Start Date

Due Date

Priority

Instructions

Required/Optional status

Mentor

Review requirement

Completion rules

---

# 17. Learner Dashboard

When a learner logs in, show a clean dashboard.

Example:

Welcome back.

Current Learning Path
Junior IT Infrastructure Engineer

Overall Progress
████████████░░░░░░
62%

Continue Learning
Windows Server → Active Directory Basics

Due Soon
Network Lab — 3 days

Pending Review
Active Directory Lab

This Week
8h 42m studied

Recent Achievements
Completed: TCP/IP
Completed: Subnetting Exercise

The dashboard should clearly answer:

What should I do next?

What have I completed?

What is due?

What needs review?

How am I progressing?

---

# 18. Interactive Learning Experience

Lessons should not feel like static documentation.

A lesson can contain:

Content

Tasks

Resources

Exercises

Questions

Code

Images

Attachments

Notes

Discussions

Submissions

Completion controls

Provide distraction-free reading mode.

Track:

started

last viewed

completed

time spent

---

# 19. Progress Engine

Progress must be calculated dynamically.

Track progress at:

Task

Lesson

Module

Stage

Project

Learning Path

Assignment

Team

Cohort

Organization

Do not store only a single percentage.

Store meaningful completion events and derive analytics when appropriate.

---

# 20. Completion Rules

Allow configurable completion rules.

Examples:

Automatically complete lesson after all tasks are complete.

Require learner confirmation.

Require assessment score >= 80%.

Require project submission.

Require mentor approval.

Require all mandatory items.

Allow optional items not to block completion.

---

# 21. Submissions

Learners must be able to submit evidence of work.

Submission types:

Text response

Markdown response

File upload

Image

PDF

Git repository URL

Website URL

Video URL

External link

Multiple attachments

Example:

Task:
Create a Windows Server lab.

Learner submission:

Description

Screenshots

Network diagram

Configuration notes

Git repository

Manager or mentor can review it.

---

# 22. Review Workflow

Submission states:

Draft

Submitted

Under Review

Changes Requested

Approved

Rejected

Reviewer can provide:

comments

feedback

approval

requested changes

optional score

Learner should receive notifications.

---

# 23. Comments & Discussions

Allow discussions on:

lessons

tasks

projects

submissions

Users can:

comment

reply

mention users

resolve discussions where appropriate

Keep an audit history for important review actions.

---

# 24. Personal Notes

Learners can create private notes.

Notes can belong to:

Lesson

Module

Project

Learning Path

Support Markdown.

Private notes should not automatically be visible to managers.

Respect privacy boundaries in the data model.

---

# 25. Study Sessions

Allow learners to record study sessions.

Fields:

Start time

End time

Duration

Learning Path

Module

Lesson

Description

Optional Notes

Provide optional timer:

START STUDY SESSION

01:24:37

STOP

Save the resulting activity.

Allow manual correction.

---

# 26. Activity Timeline

Maintain a meaningful learning activity timeline.

Example:

October 10

09:30
Started TCP/IP Fundamentals

11:15
Completed TCP/IP Fundamentals

14:20
Submitted Network Lab

October 11

10:00
Mentor approved Network Lab

This timeline becomes an important source for reporting.

---

# 27. Reports

Reporting is a major commercial feature.

Generate:

Individual Report

Team Report

Cohort Report

Learning Path Report

Organization Report

Weekly Report

Monthly Report

Custom Date Range Report

Project Report

Completion Report

---

# 28. Individual Learner Report

Example:

Learner Progress Report

Employee:
John Doe

Learning Path:
Junior Network Engineer

Period:
September 1 – September 30

Overall Progress:
64%

Study Time:
42h 15m

Completed:
18 Lessons
73 Tasks
12 Exercises
3 Projects

Projects:

Network Fundamentals Lab
Approved

Windows Server Lab
Pending Review

Current Focus:
Active Directory

Manager Feedback:
...

The report should look professional enough to give to:

a manager

HR

mentor

university supervisor

internship coordinator

client

---

# 29. PDF Reports

Professional PDF generation is important.

Reports should include:

Organization branding

Logo

Learner name

Report period

Progress

Charts

Completed work

Projects

Study time

Manager feedback

Signatures / approval information when configured

Generated date

Report ID

Allow:

Download PDF

Print Report

---

# 30. Online Reports

Do not require PDF for every report.

Managers should have live online reports.

Example URL concept:

/organizations/acme/reports/users/123

The report should update as progress changes.

Implement authorization carefully.

---

# 31. Shareable Reports

Allow a user or authorized manager to create a secure share link.

Example use case:

An intern needs to send their internship progress report to a university supervisor.

The system creates a secure report link.

Support:

expiration date

revocation

optional password

read-only access

Do not expose private workspace data through public links.

---

# 32. Manager Dashboard

Manager dashboard should answer:

Who is progressing?

Who has pending work?

Which assignments are overdue?

Which submissions require review?

Which learning paths are active?

What has happened recently?

Views:

My Learners

Team Progress

Pending Reviews

Deadlines

Activity

Reports

---

# 33. Learner Profile

Create a professional learner profile.

Show:

Assigned Paths

Completed Paths

Projects

Skills

Achievements

Learning History

Reports

Activity

Study Time

Do not expose private notes.

---

# 34. Skills

Allow learning content to map to skills.

Example:

Lesson:
TCP/IP Fundamentals

Skills:
Networking Fundamentals
TCP/IP

Project:
Windows Domain Lab

Skills:
Windows Server
Active Directory
DNS
DHCP

Completing learning activities can contribute evidence toward skills.

---

# 35. Skill Matrix

Organizations should eventually be able to see:

Employee        Networking   SQL   Windows Server   VMware

Ali             ████████     ███   ██████           ██
Sara            █████        ████  ████████         █████

Do NOT treat completion percentage as an objective measure of real-world skill.

Clearly distinguish:

training completion

assessment results

reviewed evidence

self-reported experience

This distinction is important.

---

# 36. Assessments

Support assessment entities.

Initial question types:

Multiple Choice

Multiple Select

True/False

Short Answer

Long Answer

Manual Review

Future architecture should allow:

Coding Exercises

External assessment providers

Question banks

Randomized questions

Do not over-engineer these future features in MVP.

---

# 37. Certificates

Support completion certificates.

Certificate may contain:

Learner

Learning Path

Organization

Completion Date

Certificate ID

Verification URL

Organization branding

Only issue certificates when configured completion requirements are satisfied.

---

# 38. Search

Implement powerful search.

Search across:

Learning Paths

Modules

Lessons

Projects

Resources

Users

Teams

Skills

Content

Search results must respect permissions and tenant boundaries.

---

# 39. Notifications

Build a notification system.

Examples:

New assignment

Due date approaching

Submission received

Submission approved

Changes requested

New comment

Mention

Path completed

Certificate issued

Initially:

In-app notifications

Architecture should later support:

Email

Push

Webhook

Do not tightly couple domain logic to notification delivery.

Use events.

---

# 40. Event-Driven Architecture

Important actions should generate domain events.

Examples:

USER_INVITED

PATH_ASSIGNED

LESSON_STARTED

TASK_COMPLETED

LESSON_COMPLETED

SUBMISSION_CREATED

SUBMISSION_APPROVED

PATH_COMPLETED

REPORT_GENERATED

CERTIFICATE_ISSUED

Events can later power:

notifications

analytics

audit logs

integrations

webhooks

automation

---

# 41. Audit Log

For organizations, maintain audit records for important administrative actions.

Examples:

User invited

Role changed

Learning path modified

Assignment created

Submission approved

Report shared

Organization setting changed

Audit logs should include:

actor

action

target

timestamp

relevant metadata

---

# 42. Analytics

Provide useful analytics.

Examples:

Active Learners

Completion Rate

Average Completion Time

Study Activity

Task Completion

Lesson Completion

Project Completion

Overdue Assignments

Pending Reviews

Path Drop-off

Module Drop-off

Do not create misleading metrics.

Explain what each metric actually represents.

---

# 43. Learning Path Analytics

For a learning path show:

Number Assigned

Number Started

Number Completed

Average Progress

Average Completion Time

Most Difficult Modules based on measurable signals

High Drop-off Lessons

Commonly delayed assignments

Do not infer learner intelligence or ability from these analytics.

---

# 44. Import

Support importing learning content.

At minimum:

Markdown folder

ZIP containing Markdown structure

Future:

Git repository

GitHub repository

Notion

CSV

Other LMS formats

Build the import layer using adapters so future import formats can be added.

---

# 45. Export

Support exporting:

Learning Path → Markdown

Learning Path → ZIP

Reports → PDF

Reports → HTML

Reports → Markdown

User progress → JSON

Organization data → appropriate administrative export

Avoid vendor lock-in.

---

# 46. Git Integration Architecture

Do not require Git integration for MVP, but design the content engine so it can eventually support:

GitHub

GitLab

self-hosted Git

Possible workflow:

Git Repository
      ↓
Content Sync
      ↓
Content Validation
      ↓
Preview
      ↓
Publish

Do not couple core content storage directly to Git.

---

# 47. Content Lifecycle

Content should have states:

Draft

Published

Archived

Allow preview before publishing.

Learners should normally see published content only.

---

# 48. Content Versioning

Changes to published content must be version-aware.

Keep:

created_at

updated_at

version

author

change history

Do not destroy old learner history when content changes.

---

# 49. Content Validation

Validate imported or edited content.

Detect:

Duplicate IDs

Broken prerequisites

Circular dependencies

Missing references

Invalid metadata

Invalid hierarchy

Broken internal links

Invalid resource definitions

Provide human-readable errors.

---

# 50. Stable IDs

Never use file path as the permanent identity of content.

Use stable IDs.

Example:

lesson_01JAB...

Moving:

networking/tcp-ip.md

to:

fundamentals/networking/tcp-ip.md

must not destroy learner progress.

---

# 51. Deleted Content

Never silently delete historical learning records.

If content previously completed by a learner is removed:

preserve historical completion

mark content as archived/deleted

retain reports and auditability

Do not silently recalculate history as though it never existed.

---

# 52. Internationalization

Design for internationalization from the beginning.

Initial UI may be English.

Architecture should support:

English

Persian

Arabic

German

and additional languages.

Support RTL layouts.

Do not hardcode UI text throughout components.

Use translation keys.

---

# 53. Time Zones

Store timestamps appropriately.

Users may be in different time zones.

Display dates/times according to user or organization settings.

---

# 54. Accessibility

Follow modern accessibility practices.

Keyboard navigation

Semantic HTML

Accessible forms

Proper labels

Sufficient contrast

Screen reader support

Focus management

Do not treat accessibility as an afterthought.

---

# 55. Responsive Design

The application must work well on:

Desktop

Laptop

Tablet

Mobile

Desktop should provide the richest management experience.

Learner workflows should work especially well on mobile.

---

# 56. PWA

Consider making the application installable as a Progressive Web App.

Potential features:

Install to desktop/mobile

Offline reading of previously loaded content

Resume when online

Do not make offline support block the initial MVP if it adds excessive complexity.

---

# 57. UI Philosophy

The UI should feel like a premium modern SaaS.

Avoid:

generic admin templates

excessive gradients

unnecessary animations

clutter

huge cards everywhere

dashboard overload

Prioritize:

clarity

information hierarchy

speed

professional typography

good whitespace

excellent dark mode

responsive interactions

---

# 58. Main Navigation — Learner

Home

My Learning

Tasks

Projects

Submissions

Timeline

Reports

Notes

Profile

---

# 59. Main Navigation — Manager

Dashboard

People

Teams

Learning Paths

Assignments

Reviews

Reports

Analytics

Content

Settings

---

# 60. Command Palette

Implement a command palette similar to modern productivity applications.

Shortcut:

Ctrl/Cmd + K

Actions:

Search content

Open learner

Open path

Create lesson

Create assignment

Open reports

Navigate pages

---

# 61. Dark / Light Mode

Support:

Light

Dark

System

Persist preference.

---

# 62. Authentication

Production architecture should support:

Email/password

Email verification

Password reset

Session management

Future-ready for:

Google OAuth

Microsoft OAuth

GitHub OAuth

Enterprise SSO

SAML

OIDC

Do not implement insecure custom authentication unnecessarily.

Use a proven authentication solution compatible with the selected stack.

---

# 63. Invitations

Organizations should invite members.

Workflow:

Manager enters email

↓

Invitation generated

↓

User receives invitation

↓

Creates/links account

↓

Joins organization

↓

Receives assigned role/team/path

Invitation links must:

expire

be single-purpose

be securely generated

be revocable

---

# 64. Security

Treat security as a first-class requirement.

Protect against:

Broken authorization

Cross-tenant data exposure

CSRF

XSS

SQL injection

Unsafe file uploads

Malicious Markdown

IDOR

Privilege escalation

Rate abuse

Session attacks

Do not trust frontend authorization.

Every protected operation must be validated server-side.

Sanitize rendered Markdown.

---

# 65. File Upload Security

Validate:

file size

MIME type

extension

authorization

ownership

storage path

Use private storage where appropriate.

Use signed URLs for protected files.

Architecture should allow future malware scanning.

---

# 66. Database

Use PostgreSQL for the SaaS architecture.

Design a clean relational schema.

Likely entities include:

User

Organization

Membership

Role

Permission

Team

TeamMember

Cohort

LearningPath

LearningPathVersion

Stage

Module

Lesson

Task

Exercise

Project

Assessment

Resource

Skill

ContentSkill

Assignment

AssignmentProgress

TaskProgress

Submission

SubmissionFile

Review

Comment

Note

StudySession

ActivityEvent

Notification

Report

Certificate

AuditLog

Invitation

ShareLink

Do not blindly implement this exact list.

Normalize the model based on domain analysis.

Avoid both:

one giant generic table

and

unnecessary table explosion.

---

# 67. IDs

Use globally unique non-sequential public IDs such as:

UUID

or

ULID

Avoid exposing sequential database IDs in public URLs where inappropriate.

---

# 68. API

Build a clear API boundary.

REST is acceptable.

Typed API solutions are also acceptable.

The API should support future clients:

Web

Mobile

Desktop

Integrations

Document API contracts.

---

# 69. Background Jobs

Use background jobs where appropriate.

Examples:

PDF generation

email delivery

large imports

large exports

analytics aggregation

certificate generation

Do not make slow jobs block HTTP requests unnecessarily.

---

# 70. Storage

Use storage abstraction.

Development:

Local compatible storage

Production:

S3-compatible object storage

Store:

uploads

submission files

organization logos

report PDFs

certificate PDFs

Do not tightly couple application code to one cloud vendor.

---

# 71. Caching

Introduce caching only where justified.

Potential candidates:

published learning paths

permissions

analytics queries

search results

Do not prematurely cache everything.

---

# 72. Search Architecture

For MVP, PostgreSQL full-text search may be sufficient.

Design a search abstraction so the system could later migrate to:

Meilisearch

Typesense

Elasticsearch

OpenSearch

without rewriting the product domain.

---

# 73. Billing Architecture

Do NOT necessarily implement full billing in MVP.

But design the SaaS architecture to support plans.

Possible plans:

Free

Team

Business

Enterprise

Potential limits:

Members

Active learning paths

Storage

Reports

Advanced analytics

SSO

API access

Custom branding

Keep entitlement checks centralized.

Future Stripe integration should be possible.

---

# 74. White Label / Branding

Organizations may configure:

Logo

Organization Name

Report Branding

Certificate Branding

Potential future:

Custom Domain

Brand Colors

Email Branding

---

# 75. Platform Administration

Create a separate platform administration area.

Platform admin can view:

Organizations

Users

Usage

Storage

Platform events

Failed jobs

System metrics

Plans

Feature flags

Do not expose platform administration routes to organization admins.

---

# 76. Feature Flags

Design support for feature flags.

Useful for:

beta features

organization-specific features

gradual rollouts

enterprise functionality

---

# 77. API Tokens

Future architecture should support organization API tokens.

Possible integrations:

HR systems

internal portals

automation systems

CI/CD

Git providers

Do not expose API tokens in plaintext after creation.

---

# 78. Webhooks

Future-ready webhook system.

Events:

assignment.created

submission.created

submission.approved

path.completed

certificate.issued

Support:

signed payloads

retry

delivery history

secret rotation

---

# 79. Privacy

Define clear visibility rules.

Examples:

Learner private notes → learner only

Submission → learner + authorized reviewers

Progress → learner + authorized organization members

Organization analytics → authorized managers/admins

Public report → only through explicit share mechanism

Never assume all organization members can see everything.

---

# 80. Data Ownership

Organizations should be able to export their data.

Users should be able to export appropriate personal learning data.

Design data ownership rules explicitly.

---

# 81. Soft Deletion

Use soft deletion where historical integrity matters.

Examples:

Learning Paths

Users within organization context

Lessons

Projects

Assignments

Preserve reporting history.

---

# 82. Auditability

Important historical reports should remain reproducible where practical.

For example, if a learner completed version 2 of a learning path, later edits to version 3 should not make the historical report falsely represent what they completed.

---

# 83. Reporting Engine

Do not build reporting as a collection of random UI queries.

Create a reporting service/domain.

Inputs:

organization

learner/team/path

date range

report type

filters

Output:

structured report model

Then render the same model into:

Web

PDF

HTML

Markdown

This avoids inconsistent reports.

---

# 84. Print Design

Create dedicated print CSS.

Reports printed directly from browser should look professional.

Hide:

navigation

buttons

interactive controls

Show:

branding

report metadata

charts

tables

page-friendly sections

---

# 85. Dashboard Widgets

Build dashboards using reusable widgets.

Examples:

Progress

Study Time

Assignments

Pending Reviews

Activity

Completion

Deadlines

Do not tightly couple analytics logic to visual components.

---

# 86. Empty States

Design excellent empty states.

Example:

No Learning Paths Yet

Create your first learning path or import one from Markdown.

[Create Path]
[Import Markdown]

A new organization must not feel broken or confusing.

---

# 87. Onboarding Experience

First-time organization onboarding:

Create Organization

↓

Invite Team

↓

Create or Import Learning Path

↓

Assign Path

↓

Track Progress

Provide sample/demo content if useful.

---

# 88. Demo Organization

Development/demo environment should include realistic sample data.

Example:

Northstar Technologies

Teams:

IT Interns

Infrastructure Team

Learners

Mentors

Managers

Paths:

IT Infrastructure Internship

Employee Onboarding

Include realistic activity, submissions, reports, and analytics.

Do not couple production code to demo data.

---

# 89. Markdown Repository Structure

Support structures such as:

roadmap/
│
├── roadmap.yml
├── README.md
│
├── stages/
│   ├── 01-fundamentals/
│   │   ├── README.md
│   │   ├── modules/
│   │   │   ├── networking/
│   │   │   │   ├── README.md
│   │   │   │   ├── tcp-ip.md
│   │   │   │   └── subnetting.md
│
├── projects/
│   └── final-project.md
│
├── resources/
│   └── README.md
│
└── assets/

Do not force one exact directory layout if IDs and metadata can describe the structure safely.

---

# 90. Import Preview

Before importing Markdown:

Parse

↓

Validate

↓

Show Preview

↓

Show Errors / Warnings

↓

Confirm Import

Never silently import malformed content.

---

# 91. Markdown Export

Exported learning paths should remain useful without the SaaS.

Generate:

README.md

modules

lessons

projects

resources

assets

A developer should be able to open the exported repository on GitHub and understand the path.

---

# 92. Content Duplication

Allow:

Duplicate Learning Path

Duplicate Module

Save as Template

Copy Content

But maintain new IDs where identity should diverge.

---

# 93. Path Customization

A manager may start with a template and customize it for a learner.

Example:

Base:
Junior IT Engineer

For Ali:

Add SQL Server

Remove Linux

Add Company Internal Systems

Keep the relationship to the source template when appropriate.

Design inheritance/forking carefully.

Do not create a fragile deep inheritance system.

Snapshot + provenance may be preferable.

Evaluate this during architecture design.

---

# 94. Deadlines

Assignments can have deadlines.

Display:

Due Soon

Overdue

Completed Late

Completed On Time

Deadline changes should be audited where important.

---

# 95. Milestones

Learning paths may define milestones.

Example:

Milestone 1
Infrastructure Fundamentals

Requirements:

Networking completed

Windows fundamentals completed

Lab approved

Display milestone progress.

---

# 96. Dependencies

Support prerequisites.

Example:

Active Directory
requires
Windows Server Fundamentals

Visualize dependencies when useful.

Detect circular dependencies.

---

# 97. Roadmap Visualization

Provide visual roadmap view.

Example:

Fundamentals
    ↓
Networking
    ↓
Windows Server
    ↓
Active Directory
    ↓
Virtualization
    ↓
Final Infrastructure Project

Do not sacrifice usability for flashy graphs.

Provide both:

structured list/tree view

visual roadmap view

---

# 98. Calendar / Schedule View

Provide deadline-oriented view.

Show:

Assignments

Due dates

Milestones

Scheduled assessments

Future architecture may integrate:

Google Calendar

Outlook

---

# 99. Reporting to Employer

A core workflow is:

Employer creates learning path

↓

Assigns it to intern

↓

Intern studies

↓

Completes tasks

↓

Submits projects/evidence

↓

Mentor reviews

↓

Progress accumulates

↓

Employer opens live dashboard

OR

Intern generates professional report

↓

PDF / secure share link

This workflow must feel excellent.

Treat it as a primary product use case.

---

# 100. Product Quality

The final product should feel:

Fast

Reliable

Professional

Simple

Modern

Trustworthy

Do not confuse "powerful" with "complicated."

Advanced functionality should not make basic workflows difficult.

---

# 101. Suggested Technology Stack

Evaluate before implementation.

Preferred baseline:

Frontend / Full Stack:
Next.js + TypeScript

UI:
Tailwind CSS
accessible component primitives

Database:
PostgreSQL

ORM:
Prisma or Drizzle

Authentication:
proven production-ready auth solution

Object Storage:
S3-compatible abstraction

Background Jobs:
appropriate queue/job system

Markdown:
Unified / Remark / Rehype ecosystem

Validation:
Zod or equivalent

Testing:
Unit + Integration + E2E

PDF:
server-side or headless-browser report rendering

Deployment:
Docker-friendly

Do not select technology simply because it is fashionable.

Explain important choices.

---

# 102. Architecture Requirements

Use a maintainable modular architecture.

Possible domain modules:

auth

organizations

memberships

teams

content

learning-paths

assignments

progress

submissions

reviews

reports

analytics

notifications

files

audit

billing

Do not create a giant application service.

Do not put business logic directly inside UI components.

---

# 103. Testing

Implement serious tests for critical behavior.

Especially:

Tenant isolation

Authorization

Role permissions

Content parsing

Content validation

Versioning

Assignment logic

Progress calculation

Completion rules

Submissions

Review workflow

Report calculations

Share-link authorization

Deleted/archived content

Markdown sanitization

File permissions

---

# 104. E2E Scenarios

Create automated end-to-end tests for key journeys.

Scenario 1:

Organization owner registers

Creates organization

Creates learning path

Invites learner

Assigns path

Learner completes task

Manager sees progress

Scenario 2:

Learner submits project

Mentor requests changes

Learner resubmits

Mentor approves

Progress updates

Scenario 3:

Manager generates learner report

Downloads PDF

Scenario 4:

Markdown path imported

Validated

Published

Assigned

Scenario 5:

User from Organization A attempts to access Organization B data

Access must be denied.

---

# 105. Observability

Production architecture should support:

Structured logs

Error tracking

Request IDs

Job monitoring

Basic metrics

Do not log:

passwords

tokens

private note contents

sensitive uploaded content unnecessarily

---

# 106. Performance

Avoid obvious N+1 queries.

Paginate large lists.

Use indexes appropriately.

Lazy-load heavy UI.

Optimize large organizations.

The architecture should reasonably support organizations with:

hundreds or thousands of users

many learning paths

large activity histories

without fundamental redesign.

---

# 107. Development Environment

Provide a simple local setup.

Prefer:

docker compose up

for infrastructure dependencies.

Provide:

.env.example

database migrations

seed command

development command

test command

build command

lint command

content validation command

---

# 108. Documentation

Create excellent documentation.

README.md

docs/
    architecture.md
    database.md
    permissions.md
    multi-tenancy.md
    content-model.md
    markdown-format.md
    learning-path-versioning.md
    progress-engine.md
    reporting.md
    security.md
    deployment.md
    development.md

Include diagrams where helpful.

---

# 109. Architecture Decision Records

For important choices create ADRs.

Examples:

Why PostgreSQL?

Why selected authentication solution?

How multi-tenancy works?

How learning path versioning works?

How Markdown maps to content entities?

How progress survives content changes?

How reports are generated?

This will make future development significantly easier.

---

# 110. Development Phases

Do NOT attempt to build everything simultaneously.

Create a phased implementation plan.

## Phase 1 — Foundation

Repository

Database

Authentication

Organizations

Memberships

RBAC

Basic UI shell

## Phase 2 — Content Engine

Learning Paths

Modules

Lessons

Markdown

Editor

Import

Validation

## Phase 3 — Learning

Assignments

Progress

Tasks

Study sessions

Learner dashboard

## Phase 4 — Collaboration

Submissions

Reviews

Comments

Mentors

## Phase 5 — Reporting

Analytics

Reports

PDF

Share links

## Phase 6 — Productization

Organization branding

Certificates

Notifications

Audit logs

Advanced admin

## Phase 7 — Commercialization

Plans

Billing

Entitlements

Enterprise features

Integrations

Do not implement Phase 7 before the core product works well.

---

# 111. MVP Definition

The first genuinely usable MVP must allow:

1. Create an account.
2. Create an organization.
3. Invite a learner.
4. Create/import a learning path.
5. Add modules and lessons.
6. Add tasks/projects.
7. Assign path to learner.
8. Learner reads content.
9. Learner completes tasks.
10. Learner submits work.
11. Manager reviews work.
12. Progress updates.
13. Manager sees learner dashboard.
14. Generate professional report.
15. Export report as PDF.

Everything beyond this is secondary until this flow is excellent.

---

# 112. Critical Architectural Rule

The domain must NOT assume that content is educational in the traditional academic sense.

A path could represent:

Employee Onboarding

Software Engineering Training

Factory Safety Training

Sales Training

Machine Operation Training

University Internship

Certification Preparation

Company Procedures

Personal Development

Therefore avoid domain assumptions such as:

every lesson has a quiz

every course has a teacher

every learner is a student

Prefer generic concepts:

Learning Path

Participant/Learner

Manager/Mentor

Activity

Task

Submission

Evidence

Completion Rule

---

# 113. Future Mobile Application

Design the API and authentication architecture so native mobile apps can eventually be created without rebuilding the backend.

Do NOT build native apps in the initial version.

---

# 114. Future AI Layer

Do not make AI mandatory for the core platform.

However, design extension points for future AI features such as:

Generate learning path from a job description

Generate lesson summaries

Suggest exercises

Generate assessments

Analyze learning gaps

Generate progress summaries

Help managers draft feedback

Search knowledge semantically

Answer questions based on assigned content

AI-generated content must be reviewable before publishing.

Do not let AI silently change official organization training content.

---

# 115. AI Progress Reports

Future architecture may support AI-generated narrative reports based on factual platform data.

Example:

"During September, the learner completed 12 of 16 assigned lessons and submitted two infrastructure projects. The Windows Server project was approved after one revision."

AI must not invent performance claims.

Narrative reports must be grounded in stored platform data.

---

# 116. Marketplace — Future

Do not implement now.

But avoid architecture that prevents a future marketplace where creators can publish:

Learning Path Templates

Onboarding Templates

Technical Roadmaps

Training Programs

Organizations could install a template into their workspace and customize it.

---

# 117. Commercial Readiness

Think beyond coding.

The architecture should eventually support:

Subscription plans

Usage limits

Organization billing

Trial periods

Enterprise contracts

Custom branding

SSO

API access

Webhooks

Data exports

Backups

Support tooling

Do not implement all of them immediately.

Ensure the architecture does not make them prohibitively difficult later.

---

# 118. Product Identity

Use a temporary internal project name.

Do NOT tightly embed the temporary name into domain code.

Branding should be configurable.

We may rename the product before launch.

---

# 119. Final UX Standard

Every major page should answer a clear user question.

Learner Dashboard:
"What should I work on next?"

Manager Dashboard:
"What needs my attention?"

Learning Path:
"What is the training structure?"

Learner Profile:
"How is this person progressing?"

Reviews:
"What work requires review?"

Reports:
"What happened during this period?"

Analytics:
"What patterns exist across the training program?"

Do not add UI elements unless they support a meaningful user goal.

---

# 120. Before Writing Code

STOP before implementation.

First produce:

1. Product requirements analysis
2. Domain model
3. User roles and permissions matrix
4. Multi-tenant strategy
5. System architecture
6. Database ERD
7. Content model
8. Markdown specification
9. Learning path versioning strategy
10. Progress calculation strategy
11. Report architecture
12. File storage architecture
13. Security threat analysis
14. API architecture
15. Proposed repository structure
16. Technology decisions
17. MVP scope
18. Development roadmap
19. Major risks
20. Architecture Decision Records

Explain important tradeoffs.

Only after the architecture is coherent should implementation begin.

---

# 121. Implementation Rule

When implementation begins:

Work incrementally.

After every major phase:

run tests

run lint

run type checking

run database migrations

test key flows

fix errors

Do not continue building on a broken foundation.

---

# 122. Definition of Done

Do NOT consider the project finished because pages exist.

The system is complete only when real workflows function end-to-end.

At minimum verify:

Employer creates organization.

Employer creates a learning path without editing source code.

Employer can alternatively import Markdown.

Employer invites an intern.

Employer assigns the learning path.

Intern logs in.

Intern follows the roadmap.

Intern completes tasks.

Intern submits evidence.

Mentor reviews submission.

Progress updates correctly.

Employer sees progress.

Intern sees progress.

Employer generates report.

Intern can generate allowed personal report.

Report prints professionally.

PDF export works.

Tenant isolation tests pass.

Permissions work.

Content can change without application source-code changes.

Historical progress survives safe content updates.

The system works with a completely different learning path without code modifications.

---

# FINAL INSTRUCTION

Treat this as the foundation of a real commercial software product.

Prioritize, in order:

1. Correct domain model
2. Data integrity
3. Tenant isolation
4. Security
5. Excellent core workflows
6. Content flexibility
7. Maintainability
8. User experience
9. Reporting quality
10. Extensibility

Do not optimize for the largest possible feature count.

A smaller number of exceptionally well-designed, fully working features is better than dozens of half-implemented features.

Do not create fake buttons, placeholder dashboards, mocked production functionality, or TODO implementations and call the application complete.

Most importantly:

A company with no programming knowledge must be able to create a training program, invite an intern, assign that program, track the intern's work, review submitted evidence, and receive a professional progress report without modifying a single line of application source code.

A technical user should additionally be able to manage the same training content efficiently through Markdown and Git-compatible workflows.

Build the platform around these two experiences.