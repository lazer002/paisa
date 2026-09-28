# PAISA — Complete Project Architecture & Product Specification

**Document version:** 1.0  
**Project:** PAISA  
**Document purpose:** Complete A-to-Z technical and product context for developers, AI coding assistants, architects, and future maintainers.  
**Scope:** Current backend architecture, model inventory, domain relationships, security, multi-tenancy, workflows, intended product capabilities, implementation rules, known design notes, and future roadmap.

---

# 1. Project Overview

PAISA is a multi-tenant education, institute-management, employee-management, CRM, communication, attendance, assessment, gamification, support, finance, and HR platform.

The system is designed to support organizations such as schools, colleges, coaching institutes, training organizations, education businesses, and organizations that also need employee and operational management.

The platform is not intended to be a collection of disconnected CRUD screens. The architecture is designed around interconnected business domains:

- Organization and tenant management
- Authentication and authorization
- Users and role-based access
- Students
- Teachers
- Employees
- Departments
- Classes
- Enrollments
- Attendance
- Geofencing
- QR attendance
- Device management
- Tests and examinations
- Questions and question banks
- Test attempts
- Assignments and submissions
- Study materials
- Live classes
- Events and announcements
- Notifications
- Gamification
- Achievements
- Points
- Streaks
- Leaderboards
- CRM
- Leads
- Contacts
- Customers
- Deals
- Pipelines
- CRM activities, tasks, and notes
- Conversations and messaging
- Support tickets and ticket messages
- HR
- Salary structures
- Payroll
- Performance reviews
- Employee documents
- Certificates
- Invoices and payments
- Audit logs
- Event/outbox processing
- Sessions and devices
- Security and compliance

The central architectural principle is that business data belongs to an organization/institute tenant, while authentication belongs to users.

---

# 2. High-Level Technology Stack

## Backend

The backend is based on:

- Node.js
- Express
- MongoDB
- Mongoose
- JWT authentication
- HTTP-only cookies
- Bearer-token fallback
- bcrypt password hashing
- Joi validation
- Helmet
- CORS
- Rate limiting
- Soft deletion
- Ownership checks
- Role-based authorization
- Multi-tenant authorization
- Audit logging
- Event-driven processing

Expected backend structure:

```text
server/
└── src/
    ├── config/
    │   └── db.js
    │
    ├── controllers/
    │
    ├── middleware/
    │
    ├── models/
    │
    ├── routes/
    │
    └── utils/
```

## Frontend

The intended frontend stack is:

- React
- Vite
- TypeScript
- Redux Toolkit
- RTK Query

The frontend should communicate with the Express API and should not bypass authorization rules implemented by the backend.

---

# 3. Core Architecture Principles

## 3.1 Multi-Tenant by Design

Most business entities belong to an organization through:

```text
instituteId
```

The organization is represented by the `Organization` model.

Every tenant-scoped query should normally include:

```js
{
  instituteId,
  ...
}
```

Controllers must never trust an `instituteId` sent by an ordinary user without verifying that the authenticated user is authorized to access that organization.

The authenticated user's tenant should generally be the source of truth.

## 3.2 Super Admin

`super_admin` is the highest-level platform role.

A super admin may operate across organizations where the authorization layer explicitly allows it.

For normal tenant users:

```text
user.instituteId === requestedResource.instituteId
```

should be treated as a basic ownership boundary.

## 3.3 Roles

The current role system contains:

```text
super_admin
admin
teacher
student
hr
employee
```

Roles are not simply UI labels. They control:

- API permissions
- Resource access
- Management hierarchy
- Administrative operations
- HR operations
- Academic operations
- Finance operations
- CRM operations
- Communication access
- Attendance capabilities

The `User` model remains the authentication identity.

Other domain models represent richer profiles.

---

# 4. User vs Employee vs Teacher vs Student

A critical architectural distinction is that authentication and business profiles are separate.

## User

`User` represents:

- Login identity
- Authentication
- Role
- Permissions
- Password
- Security
- Account state
- Lockout
- 2FA
- Profile basics
- Tenant relationship

## Employee

`Employee` represents the organization's employee/business profile.

It contains information such as:

- Employee code
- Department
- Designation
- Employment type
- Joining date
- Reporting manager
- Salary relationship
- Attendance configuration
- Education
- Experience
- Bank information
- Statutory information
- Documents
- Skills
- Certifications
- Performance information

An Employee can have a corresponding `User`.

## Teacher

Teacher is an academic profile.

A teacher can potentially also have an employee record and user record.

The architecture intentionally does not assume:

```text
Teacher === Employee === User
```

Instead:

```text
User
 ├── Teacher profile
 └── Employee profile
```

can exist where appropriate.

## Student

Student represents the academic learner.

Student can participate in:

- Classes
- Enrollments
- Tests
- Assignments
- Attendance
- Achievements
- Points
- Certificates
- CRM
- Payments
- Conversations
- Support

---

# 5. Model Inventory

The current model inventory is:

```text
Achievement.js
Announcement.js
Assignment.js
Attendance.js
AttendanceEvent.js
AuditLog.js
Certificate.js
Class.js
Contact.js
Conversation.js
counter.js
CRMActivity.js
CRMNote.js
CRMTask.js
Customer.js
Deal.js
Department.js
Device.js
Employee.js
EmployeeDocument.js
Enrollment.js
Event.js
Geofence.js
Invoice.js
Lead.js
Leaderboard.js
Leave.js
LiveSession.js
Message.js
NotificationLog.js
NotificationPreference.js
organization.js
Payment.js
Payroll.js
PerformanceReview.js
Pipeline.js
PointLedger.js
Question.js
QRSession.js
RefreshSession.js
SalaryStructure.js
Student.js
StudyMaterial.js
Submission.js
Test.js
TestAttempt.js
Ticket.js
TicketMessage.js
User.js
UserAchievement.js
```

Some models are already fully designed/generated while a few remain in the planned inventory and should be completed before the model layer is considered finished.

---

# 6. Core Domain Relationship Map

The high-level relationship is:

```text
Organization
│
├── User
│   ├── Teacher
│   ├── Student
│   └── Employee
│
├── Department
│   ├── Employees
│   └── Teachers
│
├── Class
│   ├── Students
│   ├── Teachers
│   ├── Assignments
│   ├── Tests
│   ├── Attendance
│   ├── Live Sessions
│   └── Study Materials
│
├── Enrollment
│
├── Attendance
│   ├── AttendanceEvent
│   ├── QRSession
│   ├── Device
│   └── Geofence
│
├── Assessment
│   ├── Test
│   ├── Question
│   └── TestAttempt
│
├── Academic Content
│   ├── Assignment
│   ├── Submission
│   └── StudyMaterial
│
├── Gamification
│   ├── Achievement
│   ├── UserAchievement
│   ├── PointLedger
│   ├── Streak
│   └── Leaderboard
│
├── CRM
│   ├── Lead
│   ├── Contact
│   ├── Customer
│   ├── Deal
│   ├── Pipeline
│   ├── CRMActivity
│   ├── CRMTask
│   └── CRMNote
│
├── Communication
│   ├── Conversation
│   ├── Message
│   ├── NotificationPreference
│   └── NotificationLog
│
├── Support
│   ├── Ticket
│   └── TicketMessage
│
├── HR
│   ├── Employee
│   ├── SalaryStructure
│   ├── Payroll
│   ├── PerformanceReview
│   ├── EmployeeDocument
│   └── Leave
│
├── Finance
│   ├── Invoice
│   ├── Payment
│   └── Certificate
│
└── Platform Infrastructure
    ├── AuditLog
    ├── Event
    ├── RefreshSession
    ├── Device
    └── counter
```

---

# 7. Organization Model

`organization.js` is the tenant/root business model.

It manages:

- Organization identity
- Name
- Slug
- Organization code
- Status
- Plan
- Configuration
- Limits
- Settings
- Lifecycle
- Soft deletion
- Tenant metadata

The organization is the boundary around almost all operational data.

Important principle:

```text
Organization
    ↓
instituteId
    ↓
tenant-scoped models
```

The organization model should eventually control:

- Maximum users
- Maximum students
- Maximum employees
- Storage limits
- Feature flags
- Subscription state
- Academic configuration
- Attendance configuration
- Notification settings
- CRM settings
- Payroll configuration
- Security policy

A platform-level super admin can manage organizations.

---

# 8. User Model

`User.js` is the primary authentication and authorization model.

It contains advanced concepts including:

- User identity
- User code
- Role
- Permissions
- Role hierarchy
- Institute relationship
- Profile
- Employment data
- Compensation references
- Academic references
- Authentication state
- Account lockout
- 2FA
- Security information
- Soft deletion
- Audit information

The user code is generated through the sequence utility using:

```text
user:${role}
```

The model exports:

```text
User
Roles
RolePermissions
RoleHierarchy
canManageRole
```

The authentication system should use User as the identity and connect to domain profiles rather than duplicating authentication credentials across every profile model.

---

# 9. Authentication and Session Architecture

The platform uses JWT authentication.

Preferred storage:

```text
HTTP-only secure cookie
```

Bearer authentication is available as a fallback where required.

Security components include:

- JWT
- Refresh sessions
- bcrypt
- Rate limiting
- Lockout
- Session tracking
- Device tracking
- 2FA
- Request context
- Audit logs

`RefreshSession.js` supports:

- Token hashing
- Token families
- Rotation
- Previous token hashes
- Revocation
- TTL
- Active session lookup

The refresh-token system should avoid storing raw long-lived refresh tokens when a hash can be stored instead.

---

# 10. RefreshSession Model

Purpose:

```text
Manage long-lived authentication sessions safely.
```

Important fields include:

- User
- Institute
- Token hash
- Family ID
- Previous hash
- Device
- IP context
- Revocation
- Rotation
- Expiration
- Session status

The model supports refresh-token rotation and token-family security.

A refresh-token reuse event should be treated as a security event and can trigger family/session revocation depending on the authentication service.

---

# 11. Device Model

`Device.js` is the device registry.

It supports:

- Device identity
- Fingerprinting
- Installation IDs
- Platform
- OS
- Browser
- Application version
- Trust state
- Security state
- Integrity
- Risk
- Push-token handling
- Network information
- Last activity
- Location
- Session relationship
- Compliance
- Security events

Sensitive identifiers and tokens are intended to be hashed or protected.

Device is important for:

```text
Attendance
Authentication
Security
Push notifications
Anti-fraud
Session management
```

---

# 12. Department Model

`Department.js` represents organizational units.

It supports:

- Organization
- Department identity
- Hierarchy
- Head/manager
- Budget
- Status
- Department metadata
- Lifecycle

Departments connect employees and teachers to organizational structure.

Example:

```text
Organization
└── Engineering
    ├── Employee A
    ├── Employee B
    └── Employee C
```

The department hierarchy can later be used for reporting and permissions.

---

# 13. Employee Model

`Employee.js` is the employee business profile.

It contains:

- Tenant
- Employee code
- User relationship
- Personal information
- Contact information
- Employment status
- Employment type
- Employment category
- Work mode
- Joining/exit lifecycle
- Department
- Designation
- Job grade
- Reporting manager
- Location
- Attendance configuration
- Shift information
- Salary relationship
- Bank accounts
- Statutory data
- Documents
- Leave balance
- Performance information
- Skills
- Certifications
- Access controls
- Custom fields
- Tags
- Audit information
- Legal hold
- Soft delete

Employee connects:

```text
Employee
├── SalaryStructure
├── Payroll
├── Leave
├── Attendance
├── PerformanceReview
└── EmployeeDocument
```

Employee is not a replacement for User.

---

# 14. EmployeeDocument Model

Planned/current inventory model for employee document management.

Purpose:

- Identity documents
- Address proof
- Education documents
- Experience proof
- Contracts
- Joining documents
- Tax documents
- Bank documents
- Medical records where applicable
- Background verification
- Other HR documents

The model should support:

- Employee
- Organization
- Document type
- File metadata
- Verification state
- Expiration
- Versioning
- Upload metadata
- Access control
- Audit
- Legal hold
- Soft deletion

Sensitive documents should not be exposed through unrestricted employee APIs.

---

# 15. Student Model

The Student model represents academic learners.

Student is connected to:

- User
- Organization
- Classes
- Enrollments
- Attendance
- Assignments
- Submissions
- Tests
- Test attempts
- Achievements
- Points
- Streaks
- Certificates
- Payments
- CRM records
- Support
- Communication

The student domain is the center of the academic experience.

---

# 16. Teacher Model

Teacher represents academic teaching staff.

Teacher supports:

- Organization
- User relationship
- Subjects
- Grades/classes
- Employment state
- Joining/leaving
- Academic responsibilities
- Teacher profile

Teacher can participate in:

- Classes
- Assignments
- Tests
- Live sessions
- Attendance
- Announcements
- Assessment
- Student management

Teacher and Employee are deliberately separate concepts.

---

# 17. Class Model

`Class.js` represents academic groups.

It supports:

- Class identity
- Organization
- Teacher
- Students
- Academic structure
- Live streaming
- Live sessions
- Assessment
- Ranking
- Leaderboards
- Gamification
- Attendance configuration

A class can be the common context connecting:

```text
Student
Teacher
Attendance
Assignment
Test
LiveSession
StudyMaterial
Leaderboard
```

A future scalability consideration is that very large embedded arrays such as live-session collections and leaderboard/gamification caches should not become the permanent source of truth.

---

# 18. Enrollment Model

`Enrollment.js` represents a student's formal relationship with an academic program/class/course.

It supports:

- Student
- Organization
- Class
- Enrollment status
- Enrollment type
- Payment/plan information
- Installments
- Academic snapshot
- Guardian snapshot
- Progress
- Attendance
- Transfer history
- Approval
- Documents
- Lifecycle
- Audit

Enrollment is important because student membership and class membership should not be inferred only from static Student/Class arrays.

---

# 19. Attendance Architecture

Attendance is intentionally split into multiple concepts:

```text
Attendance
AttendanceEvent
QRSession
Device
Geofence
```

## Attendance

Represents the attendance record/state.

## AttendanceEvent

Represents individual attendance events.

Examples:

```text
check_in
check_out
correction
verification
```

## QRSession

Controls temporary QR-based attendance sessions.

## Device

Controls trusted device/security context.

## Geofence

Controls physical location boundaries.

This allows the system to distinguish:

```text
attendance state
```

from:

```text
evidence/event used to create that state
```

---

# 20. AttendanceEvent Model

`AttendanceEvent.js` stores event-level attendance evidence.

It supports:

- Tenant
- User/student/employee
- Attendance reference
- Verification method
- QR
- Device
- Location
- Network
- Correction information
- Source
- Status
- Timestamps
- Audit
- Correlation
- Idempotency

Important architecture rule:

A correction should ideally be represented as a new event or service-level event chain rather than mutating historical evidence in a way that destroys the original record.

---

# 21. Geofence Model

`Geofence.js` manages physical boundaries.

Supported shapes:

```text
circle
polygon
```

Supported types include:

```text
campus
office
branch
classroom
department
warehouse
site
custom
```

Geofence supports:

- Center
- Radius
- Polygon boundaries
- Address
- Time schedule
- Attendance configuration
- Access policies
- Actions
- Security controls
- Anti-spoofing
- Mock-location detection
- GPS accuracy
- Device validation
- Session validation
- Analytics
- Lifecycle
- Legal hold
- Soft delete

Geospatial data is represented through derived GeoJSON and a `2dsphere` index.

Geofence can be used to determine:

```text
Is this location inside an allowed boundary?
```

and:

```text
Which active geofences are near this location?
```

The application should combine geofence verification with security checks rather than trusting raw coordinates alone.

---

# 22. QRSession Model

`QRSession.js` manages temporary QR attendance sessions.

It supports:

- Session code
- Token hash
- Expiration
- Scan policy
- Authorization
- Geofence
- Anti-replay
- Rate limiting
- Analytics
- Attendance configuration
- Security
- Display configuration
- Lifecycle

Important security note:

The QR token hash is protected using `select: false`.

Code that verifies a token must explicitly select the protected field.

QR sessions should be short-lived and should not be treated as permanent authentication credentials.

---

# 23. Assessment System

The assessment system contains:

```text
Test
Question
TestAttempt
```

The relationship is:

```text
Test
├── Question references
└── TestAttempt
      └── Answers
```

---

# 24. Test Model

`Test.js` is a complete assessment/exam configuration.

It supports:

- Test type
- Mode
- Status
- Question selection
- Sections
- Scheduling
- Attempt policies
- Grading
- Access policy
- Result visibility
- Anti-cheating
- Proctoring
- Ranking
- Gamification
- Certificates
- Statistics
- Tags
- Skills
- Outcomes
- Lifecycle

Lifecycle includes concepts such as:

```text
draft
scheduled
published
started
completed
closed
cancelled
archived
```

The test model defines the rules.

It does not represent an individual student's attempt.

---

# 25. Question Model

`Question.js` is a comprehensive question-bank model.

Supported concepts include:

- Question types
- Difficulty
- Status
- Visibility
- Creator
- Reviewer
- Question code
- Text
- Explanation
- Subject
- Topic
- Subtopic
- Class
- Course reference
- Tags
- Skills
- Learning outcomes
- Bloom taxonomy
- Competency
- Marks
- Negative marks
- Partial credit
- Time limit
- Options
- Answers
- Rubrics
- Attachments
- Media
- Coding configuration
- Case studies
- Versioning
- Parent question
- AI metadata
- Analytics
- Lifecycle

Question supports multiple assessment styles.

---

# 26. TestAttempt Model

`TestAttempt.js` represents a student's individual attempt.

It contains:

- Test
- Student
- Class
- Enrollment
- Attempt number
- Status
- Start time
- Pause/resume
- Deadline
- Duration
- Questions
- Answers
- Score
- Maximum score
- Percentage
- Pass state
- Rank
- Percentile
- Feedback
- Review state
- Reviewer
- Proctoring
- Risk
- Device
- Location
- Security
- Configuration snapshot
- Gamification
- Audit
- Lifecycle

The unique business constraint is:

```text
instituteId + testId + studentId + attemptNumber
```

This prevents duplicate attempt numbers for the same student/test context.

---

# 27. Assignment Model

Assignment supports academic work submission.

It includes concepts such as:

- Assignment types
- Scheduling
- Submission rules
- Rubrics
- Grading
- Group work
- Peer review
- AI evaluation configuration
- Gamification
- Attachments
- Class relationships

Assignments connect students and teachers through work.

---

# 28. Submission Model

Submission represents an individual assignment submission.

It contains:

- Assignment
- Student
- Institute
- Attachments
- Rubric
- Score
- Percentage
- Grading
- Group work
- Submission lifecycle
- Feedback
- Audit

The submission should preserve the submitted artifact and grading context rather than relying only on mutable Assignment data.

---

# 29. StudyMaterial Model

StudyMaterial represents educational content.

It supports:

- File metadata
- Visibility
- Access
- Analytics
- Archive/restore
- Class relationships
- Academic context
- Lifecycle

The access layer should ensure students can only retrieve material that their role/class/enrollment permits.

---

# 30. LiveSession Model

`LiveSession.js` manages live teaching sessions.

It supports:

- Session type
- Status
- Access
- Provider
- Participants
- Chat
- Moderation
- Recording
- Polls
- Materials
- Analytics
- Notifications
- Attendance
- Security
- Class
- Course
- Subject
- Department
- Teacher/host
- Scheduling

A major scale consideration is participant storage.

For very large sessions, embedded participant arrays can become expensive.

The current model is acceptable as the planned domain model, but service architecture should be prepared to migrate high-volume participant events to separate storage later if scale demands it.

---

# 31. Event Model

`Event.js` is a platform event/outbox model.

It supports events such as:

```text
user.created
assignment.submitted
attendance.marked
payroll.paid
CRM events
live session events
```

It stores:

- Event type
- Tenant
- Actor
- Entity
- Related entity
- Payload
- Metadata
- Tags
- Request context
- Correlation ID
- Causation ID
- Idempotency key
- Processing state
- Attempts
- Backoff
- Worker lock
- Error information
- Retention

This enables asynchronous workflows such as:

```text
Payment successful
    ↓
Event
    ↓
Notification
    ↓
Receipt
    ↓
Analytics
```

Events should be idempotent.

---

# 32. AuditLog Model

`AuditLog.js` is the compliance/security history system.

It records:

- Tenant
- Actor
- Actor snapshot
- Action
- Category
- Severity
- Outcome
- Source
- Resource
- Message
- Description
- Old/new values
- Hashes
- Sensitive field markers
- Request context
- Device
- IP
- Session
- Error information
- Metadata
- Tags
- Service/version
- Event IDs
- Correlation IDs
- Causation IDs
- Idempotency
- Retention
- Legal hold
- Integrity hashes
- Security/system flags

Audit logs are intended to be append-only.

Direct update/delete operations are protected.

This is important for:

- HR
- Payroll
- Authentication
- Attendance corrections
- Finance
- Support
- CRM
- Compliance

---

# 33. Announcement Model

Announcement provides organization-wide or targeted communication.

It supports targeting by:

- Roles
- Classes
- Departments
- Users

It also supports:

- Scheduling
- Priority
- Category
- Attachments
- Delivery channels
- Acknowledgment
- Analytics
- CTA
- Notification configuration
- Publishing
- Expiration
- Archive
- Restore

The model deliberately does not use a TTL index on expiration because historical announcements may be required for audit and analytics.

---

# 34. Notification Architecture

The notification system is separated into:

```text
NotificationPreference
NotificationLog
```

## NotificationPreference

Stores user preferences:

- Global settings
- Channel preferences
- Type preferences
- Quiet hours
- Digest configuration
- Device preferences
- Presentation
- Privacy
- Limits
- Muted notification types
- Timezone
- Locale
- Audit

## NotificationLog

Tracks actual delivery attempts.

It includes:

- Notification
- User
- Device
- Channel
- Status
- Content snapshot
- Delivery state
- Attempts
- Retry
- Scheduling
- Worker lock
- Provider information
- Errors
- Idempotency
- Correlation
- Analytics
- Retention

The distinction is:

```text
Preference = what the user wants
Log = what the system attempted/delivered
```

---

# 35. CRM Architecture

CRM consists of:

```text
Lead
Contact
Customer
Deal
Pipeline
CRMActivity
CRMTask
CRMNote
```

The system is intended to support both education CRM and general organizational CRM.

A lead can become a customer/student.

A contact can be associated with multiple business contexts.

A deal represents a commercial opportunity.

A pipeline defines stages.

Activities/tasks/notes capture operational history.

---

# 36. Lead Model

Lead is a potential customer/student/business relationship.

It supports:

- Lead code
- External ID
- Status
- Priority
- Temperature
- Lead score
- Identity
- Contact
- Address
- Source
- Campaign
- Referral
- Assignment
- Qualification
- Interested courses
- Interested classes
- Requirements
- Follow-up
- Communication counters
- Conversion
- Duplicate detection
- Engagement
- Tags
- Notes
- Custom fields
- Consent
- Audit
- Lifecycle

Leads can eventually convert into:

```text
Customer
Student
Contact
Deal
```

depending on the business workflow.

---

# 37. Contact Model

Contact is a flexible relationship/contact entity.

It supports:

- Personal data
- Business information
- User relationship
- Lead relationship
- Customer relationship
- Student relationship
- Employee relationship
- Communication preferences
- Preferred method
- Timezone
- Addresses
- Relationships
- Consent
- Do-not-contact
- Engagement
- Tags
- Segments
- Notes
- Social information
- Custom data
- Audit
- Lifecycle

Cross-tenant relationship references must always be service-validated.

---

# 38. Customer Model

Customer is a business/customer profile.

It supports:

- Customer identity
- Status
- Lifecycle stage
- Personal information
- Company information
- Communication
- Addresses
- Guardians/relationships
- User/CRM references
- Lead relationship
- Student relationship
- Source
- Campaign
- Referral
- Assignment
- Segmentation
- Tags
- Financial information
- Credit
- Engagement
- Scores
- Consent
- Do-not-contact
- Notes
- Custom fields
- Metadata
- Audit
- Lifecycle
- Legal hold
- Soft deletion

Customer can connect CRM and finance.

A known implementation note is that the `Customer` model contains a potential index mismatch where a root `primaryEmail` index may need review because the actual email field is nested under communication.

---

# 39. Deal Model

Deal represents an opportunity.

It supports:

- Deal code
- Title
- Description
- Type
- Status
- Stage
- Priority
- Lead
- Customer
- Contact
- Student
- Enrollment
- Pipeline
- Assignment
- Team
- Stage history
- Amount
- Currency
- Recurring revenue
- Discount
- Tax
- Net value
- Weighted value
- Products
- Probability
- Expected close
- Actual close
- Won/lost/cancelled
- Forecast
- Competition
- Requirements
- Activity summary
- Tags
- Custom fields
- Metadata
- Audit
- Lifecycle

Deal stage changes should be auditable.

---

# 40. Pipeline Model

Pipeline defines the sales/opportunity workflow.

It contains:

- Pipeline identity
- Status
- Display order
- Default pipeline
- Stages
- Probability
- Forecast settings
- Requirements
- Automatic tasks
- Allowed next stages
- Assignment rules
- Permissions
- Automation
- Forecast
- Manager
- Department
- Statistics
- Tags
- Custom data
- Audit
- Lifecycle

Pipeline is the configuration.

Deal is the actual opportunity.

---

# 41. CRMActivity Model

CRMActivity represents actions/events around CRM entities.

Supported concepts include:

- Activity type
- Status
- Priority
- Subject
- Description
- Outcome
- Channel
- Deal
- Lead
- Contact
- Customer
- Student
- Employee
- Enrollment
- Owner
- Team
- Schedule
- Duration
- Timezone
- Reminder
- Participants
- Location
- Communication
- Attachments
- Follow-up
- Conversion
- Source
- Campaign
- Tags
- Custom fields
- Audit
- Correlation
- Idempotency
- Lifecycle

---

# 42. CRMTask Model

CRMTask represents work that must be completed.

It supports:

- Task type
- Status
- Priority
- CRM relationships
- Owner
- Assigned user
- Team
- Watchers
- Start/due dates
- Completion
- Deferral
- Recurrence
- Parent task
- Checklist
- Previous/next task relationships
- Activity relationship
- Meeting/location
- Attachments
- Tags
- Custom fields
- Audit
- Lifecycle

A known minor implementation note is that the completion method currently assigns a dynamic `completionPercentage` property even though there is no root schema field for it. This should be cleaned up during model review.

---

# 43. CRMNote Model

CRMNote provides persistent business notes.

It supports:

- Note identity
- Title
- Content
- Type
- Status
- Visibility
- Pinning
- Importance
- Deal
- Lead
- Contact
- Customer
- Student
- Employee
- Enrollment
- Task
- Activity
- Parent note
- Author
- Owner
- Department
- Mentions
- Attachments
- Tags
- Versioning
- Edit history
- Follow-up
- Source
- Custom data
- Audit
- Lifecycle

Notes are useful for preserving context that does not belong in structured fields.

---

# 44. Conversation Model

Conversation is the container for messaging.

Supported types include:

```text
direct
group
support
crm
announcement
system
```

It supports:

- Participants
- Participant snapshots
- Owner
- Creator
- CRM context
- Last message
- Message policies
- Moderation
- Settings
- Tags
- Metadata
- Archive
- Close
- Delete
- Audit

Potential scale issue:

Very large participant arrays may eventually need a separate membership collection.

---

# 45. Message Model

Message represents an individual communication.

It supports:

- Conversation
- Sender
- Message type
- Status
- Text
- Formatted text
- Replies
- Threads
- Forwarding
- Attachments
- Location
- Contact cards
- Polls
- Mentions
- Reactions
- Delivery
- Editing
- Deletion
- Moderation
- Security
- Retention
- Tags
- Metadata
- Audit

Potential scale issue:

Large delivery/reaction arrays can become expensive. At very large scale, delivery and reaction data may need separate collections.

---

# 46. Ticket Model

Ticket is the support-case entity.

It supports:

- Ticket code
- Source
- Subject
- Description
- Type
- Status
- Priority
- Category
- Subcategory
- Requester
- Customer
- Contact
- Student
- Employee
- Lead
- Deal
- Requester snapshot
- Conversation
- Parent ticket
- Related ticket
- Assignment
- Watchers
- SLA
- Contact preferences
- Status history
- Priority history
- Resolution
- Response metrics
- Satisfaction
- Attachments
- Tags
- Custom data
- Audit
- Retention
- Soft deletion

---

# 47. TicketMessage Model

TicketMessage represents messages inside support tickets.

It supports:

- Ticket
- Parent message
- Author
- Customer/agent state
- Type
- Status
- Source
- Body
- HTML
- Email details
- Attachments
- Mentions
- Delivery
- Editing
- Deletion
- Internal/private visibility
- Templates
- Moderation
- Tags
- Metadata
- Retention

This allows support conversations to be separate from general conversations.

---

# 48. Gamification Architecture

The gamification system includes:

```text
Achievement
UserAchievement
PointLedger
Streak
Leaderboard
```

The conceptual flow is:

```text
User performs activity
       ↓
Business event
       ↓
Rule evaluation
       ↓
Points / Achievement / Streak
       ↓
Leaderboard/cache
       ↓
Notification
```

Point history should remain auditable.

---

# 49. Achievement Model

Achievement defines a goal/badge.

It supports:

- Code
- Version
- Name
- Slug
- Description
- Type
- Status
- Rarity
- Badge
- Display
- Featured
- Hidden
- Target roles
- Classes
- Departments
- Criteria
- Criteria mode
- Prerequisites
- Points
- Streak requirements
- Attendance requirements
- Rewards
- Repeatability
- Limits
- Cooldowns
- Scheduling
- Automation
- Statistics
- Tags
- Skills
- Custom fields
- Audit
- Legal hold
- Soft deletion

Achievement is configuration.

UserAchievement is the user's earned instance.

---

# 50. UserAchievement Model

UserAchievement is intended to record achievement progress/awards for an individual user.

It should connect:

```text
User
Achievement
Organization
```

It can support:

- Progress
- Completion
- Award date
- Status
- Evidence
- Points
- Source event
- Verification
- Expiration
- Repeat instances
- Notifications
- Audit

The separation allows one Achievement definition to be awarded to thousands of users without duplicating the entire definition.

---

# 51. PointLedger Model

PointLedger is intended to be the authoritative points transaction history.

It supports:

- User
- Student
- Employee
- Organization
- Transaction type
- Source
- Status
- Points
- Balance before
- Balance after
- Description
- Rule
- Reference type
- Reference ID
- Parent/reversal
- Actor
- Expiration
- Transfer
- Season
- Category
- Multiplier
- Source snapshot
- Tags
- Metadata
- Audit
- Retention

Important rule:

The service layer should atomically calculate and update point balances.

The ledger itself should not be trusted as a replacement for atomic balance logic.

---

# 52. Streak Model

Streak tracks repeated activity.

It supports:

- User/student/employee
- Activity type
- Current streak
- Best streak
- Period
- Target
- Status
- Activities
- History
- Break reason
- Rewards
- Notifications
- Class
- Department
- Tags
- Metadata
- Audit
- Legal hold
- Soft delete

Examples:

```text
7-day attendance streak
14-day study streak
30-day assignment streak
```

---

# 53. Leaderboard Model

Leaderboard provides ranking views.

It can support:

- Organization
- Class
- Department
- Period
- Category
- Ranking
- Points
- Scores
- Participants
- Visibility
- Filters
- Snapshots
- Lifecycle

Important principle:

Leaderboard data should generally be treated as a derived/cache representation.

The authoritative sources are:

```text
PointLedger
TestAttempt
Attendance
Achievements
Streaks
```

depending on the leaderboard category.

---

# 54. HR Architecture

The HR domain is:

```text
Employee
SalaryStructure
Payroll
Leave
PerformanceReview
EmployeeDocument
```

This supports:

- Hiring/onboarding
- Employment
- Salary
- Attendance
- Leave
- Performance
- Documents
- Payroll
- Exit

---

# 55. SalaryStructure Model

SalaryStructure defines compensation.

It supports:

- Salary identity
- Status
- Type
- Frequency
- Currency
- Employee
- Departments
- Designation
- Grade
- Base salary
- Components
- Benefits
- PF
- ESI
- Gratuity
- Insurance
- Tax
- Overtime
- Leave/LOP
- Effective period
- Approval
- Versions
- Revisions
- Source
- Tags
- Metadata
- Audit
- Lifecycle
- Legal hold
- Soft delete

Salary calculations should be handled by a dedicated service.

The schema's calculation method is intended as a model-level helper, not a replacement for a full payroll calculation engine.

---

# 56. Payroll Model

Payroll is the actual salary processing domain.

It supports:

- Employee
- Salary
- Allowances
- Deductions
- LOP
- Payroll period
- Status
- Approval
- Payment
- Tax
- Audit
- Lifecycle

Important implementation note:

The payroll deduction total must not treat `lopDays` as a monetary amount.

Only monetary deduction values should contribute to total deductions.

`lopDays` is a quantity and should be multiplied by the applicable LOP rate to derive `lopAmount`.

---

# 57. Leave Model

Leave manages employee/student leave workflows where applicable.

It supports:

- Request
- Type
- Dates
- Duration
- Reason
- Approval
- Rejection
- Balance
- Supporting information
- Audit
- Attendance integration

Attendance should not be independently edited in a way that breaks leave records.

Leave approval can trigger attendance synchronization through events.

---

# 58. PerformanceReview Model

PerformanceReview supports employee performance management.

It includes:

- Review identity
- Type
- Status
- Review period
- Employee
- Manager
- Reviewers
- Rating scale
- Overall score
- Normalized score
- Competencies
- Goals
- Feedback
- Strengths
- Improvements
- Outcomes
- Promotion recommendation
- Salary revision recommendation
- Development plan
- Performance improvement plan
- Attachments
- Visibility
- Acknowledgment
- Audit
- Lifecycle
- Legal hold
- Soft delete

This model can feed HR decisions, but recommendations should remain workflow data rather than automatically changing employee compensation.

---

# 59. Certificate Model

Certificate represents an issued certificate.

It supports:

- Certificate number
- Code
- External ID
- Title
- Type
- Status
- Recipient
- Student
- Employee
- User
- Enrollment
- Achievement
- Test
- Class
- Issuer
- Academic context
- Achievement details
- Dates
- Content
- Skills
- Competencies
- Template
- Document
- Versions
- Verification
- QR/security
- Delivery
- History
- Tags
- Metadata
- Source
- Audit
- Legal hold
- Soft deletion

Certificate verification should be possible without exposing unnecessary private data.

---

# 60. Finance Architecture

Finance includes:

```text
Invoice
Payment
Certificate
Payroll
```

The financial workflow can become:

```text
Customer / Student
        ↓
Invoice
        ↓
Payment
        ↓
Allocation
        ↓
Receipt
        ↓
Reconciliation
```

---

# 61. Invoice Model

Invoice should represent an amount owed.

It should support:

- Invoice identity
- Customer/student
- Organization
- Line items
- Tax
- Discount
- Total
- Due date
- Status
- Payment allocation
- Currency
- Billing snapshot
- Notes
- Audit
- Lifecycle

Invoices should preserve financial snapshots so that historical invoices do not change merely because the customer's profile changes later.

---

# 62. Payment Model

Payment is already designed as a comprehensive financial transaction model.

It supports:

- Payment identity
- Status
- Method
- Source
- Payer
- Customer/student/employee/user/contact
- Invoice
- Payer snapshot
- Amount
- Currency
- Fees
- Net amount
- Refunded amount
- Refundable amount
- Exchange rate
- Allocations
- Gateway information
- Transaction timestamps
- Failure
- Cancellation
- Bank
- Card
- UPI
- Refunds
- Description
- Notes
- Receipt
- History
- Request context
- Reconciliation
- Tags
- Metadata
- Audit
- Lifecycle

Payment status examples include:

```text
pending
authorized
processing
success
failed
cancelled
refunded
partially_refunded
```

Financial records should be carefully protected from destructive deletion.

---

# 63. Customer + Finance Relationship

A customer may have:

```text
Customer
├── Lead history
├── Deals
├── Invoices
├── Payments
├── Tickets
├── Conversations
└── Contacts
```

A student can also have financial relationships:

```text
Student
├── Enrollment
├── Invoice
├── Payment
└── Certificate
```

The service layer should ensure cross-tenant financial references are impossible.

---

# 64. Notification and Event Flow

A typical system flow:

```text
Business Action
     ↓
Controller / Service
     ↓
Database transaction
     ↓
Event
     ↓
Worker
     ├── Notification
     ├── Audit
     ├── Analytics
     └── Integration
```

For important financial/attendance operations, the event should be created only after the authoritative database state has been committed, or through an outbox/transactional strategy.

---

# 65. Idempotency

The platform uses idempotency concepts across:

- Payments
- Events
- Attendance
- CRM
- Notifications
- API requests

An idempotency key should prevent duplicate business operations.

Example:

```text
POST /payments
Idempotency-Key: abc123
```

If the same request is retried, the system should not create two payments.

---

# 66. Auditability

Critical operations should generate audit records.

Examples:

```text
User role changed
Employee salary changed
Payroll approved
Attendance corrected
Payment refunded
Deal stage changed
Ticket closed
Certificate revoked
Geofence modified
Test result changed
```

Audit logs should include:

- Who
- What
- When
- Which resource
- Old state
- New state
- Request context
- Result
- Correlation ID

---

# 67. Soft Deletion

Most important business models use:

```text
isDeleted
deletedAt
deletedBy
deletionReason
```

Soft deletion preserves business history.

Hard deletion should be extremely restricted.

Financial records, audit logs, certificates, and security data should generally have even stronger retention rules.

---

# 68. Legal Hold

Models containing sensitive or historically important records may have:

```text
legalHold
```

If legal hold is enabled, soft deletion or destructive lifecycle operations should be blocked where appropriate.

Legal hold is especially relevant for:

- HR
- Payroll
- Finance
- Tickets
- Audit
- Certificates
- CRM
- Employee documents

---

# 69. Data Security

Sensitive fields should be:

- Hashed
- Masked
- Encrypted where required
- Excluded from default query projection
- Access controlled

Examples:

```text
Password
Refresh token
Bank account number
Aadhaar-related identifiers
Push tokens
Device identifiers
Security tokens
```

The API should never return secrets simply because a document was populated.

---

# 70. API Security

Expected middleware/security stack:

```text
Helmet
CORS
Rate limiting
JWT authentication
Role authorization
Tenant authorization
Joi validation
Request sanitization
Ownership checks
Audit logging
```

A typical request should flow:

```text
Request
 ↓
Helmet / CORS
 ↓
Rate limit
 ↓
Authentication
 ↓
Tenant resolution
 ↓
Role/permission check
 ↓
Joi validation
 ↓
Ownership check
 ↓
Controller
 ↓
Service
 ↓
Model
 ↓
Audit/Event
 ↓
Response
```

---

# 71. Controller vs Service Responsibilities

Controllers should remain thin.

Controller responsibilities:

- Read request
- Validate input
- Resolve authenticated identity
- Call service
- Return response

Business logic should live in services.

For example:

```text
attendance.controller.js
        ↓
attendance.service.js
        ↓
Attendance
AttendanceEvent
Geofence
QRSession
Device
Event
AuditLog
```

This prevents business rules from being duplicated across controllers.

---

# 72. Model vs Service Responsibilities

Mongoose models should provide:

- Schema
- Validation
- Indexes
- Small domain helpers
- Query helpers
- Static queries
- Lifecycle helpers

Services should handle:

- Transactions
- Authorization
- Complex calculations
- Multi-model workflows
- External APIs
- Event creation
- Notifications
- Idempotency
- Cross-entity consistency

Do not put the entire application into Mongoose methods.

---

# 73. Transaction Strategy

MongoDB transactions should be used when multiple related writes must succeed or fail together.

Examples:

```text
Payment
 + Invoice allocation
 + Event
```

```text
Attendance
 + AttendanceEvent
 + PointLedger
 + Event
```

```text
Payroll approval
 + Payroll status
 + Payment record
 + Event
```

```text
Achievement
 + UserAchievement
 + PointLedger
 + Notification
```

Where transaction support is unavailable or not appropriate, idempotent compensating workflows should be used.

---

# 74. Attendance Example Workflow

Example:

```text
Student opens attendance screen
        ↓
Device validated
        ↓
Session authenticated
        ↓
QR scanned
        ↓
QRSession validated
        ↓
GPS captured
        ↓
Mock location checked
        ↓
GPS accuracy checked
        ↓
Geofence checked
        ↓
Attendance eligibility checked
        ↓
Duplicate check checked
        ↓
Attendance record created/updated
        ↓
AttendanceEvent created
        ↓
PointLedger event if configured
        ↓
Notification/event emitted
        ↓
AuditLog
```

This is substantially safer than:

```text
GPS says inside → mark present
```

---

# 75. Test Attempt Workflow

```text
Student opens Test
       ↓
Access policy
       ↓
Enrollment/class eligibility
       ↓
Attempt count
       ↓
Schedule validation
       ↓
Device/proctoring checks
       ↓
Create TestAttempt
       ↓
Start
       ↓
Answers
       ↓
Autosave
       ↓
Proctoring events
       ↓
Submit
       ↓
Grade
       ↓
Result visibility
       ↓
Ranking
       ↓
Gamification
       ↓
Certificate if applicable
```

The Test defines the rules.

The TestAttempt captures what happened.

---

# 76. CRM Conversion Workflow

A possible flow:

```text
Lead
 ↓
Qualification
 ↓
Activity / Task
 ↓
Deal
 ↓
Customer
 ↓
Student / Enrollment
 ↓
Invoice
 ↓
Payment
```

The system should preserve historical relationships after conversion.

Conversion should be idempotent.

---

# 77. Payroll Workflow

Typical flow:

```text
Employee
 ↓
SalaryStructure
 ↓
Payroll period
 ↓
Attendance
 ↓
Leave
 ↓
LOP
 ↓
Allowances
 ↓
Deductions
 ↓
Tax
 ↓
Payroll calculation
 ↓
Review
 ↓
Approval
 ↓
Payment
 ↓
Audit
 ↓
Event
```

Payroll calculation should happen in a dedicated service.

---

# 78. Notification Workflow

```text
Business event
 ↓
Notification eligibility
 ↓
User preference
 ↓
Quiet hours
 ↓
Channel selection
 ↓
Notification creation
 ↓
NotificationLog
 ↓
Provider
 ↓
Delivery
 ↓
Retry if appropriate
 ↓
Analytics
```

The NotificationLog must not be confused with the user's preference configuration.

---

# 79. Search Architecture

Text indexes exist for major searchable models.

Examples:

```text
Employee
Customer
Geofence
```

Search should always be tenant scoped.

Bad:

```js
Model.find({ $text: { $search: q } })
```

Good:

```js
Model.find({
  instituteId,
  isDeleted: false,
  $text: {
    $search: q,
  },
});
```

This is both a security and performance requirement.

---

# 80. Indexing Philosophy

Indexes should prioritize:

1. Tenant
2. Primary filter
3. Status
4. Time
5. Common relationship
6. Search

Examples:

```text
instituteId + status
instituteId + departmentId + status
instituteId + studentId
instituteId + createdAt
```

Indexes must be reviewed against actual query patterns.

Too many indexes increase write cost.

---

# 81. Data Growth Considerations

MongoDB documents have a practical size limit.

Embedded arrays should not grow without limits.

Known areas requiring future scale review include:

```text
Conversation.participants
Message.delivery
Message.reactions
Class.liveSessions
QRSession.scans
Employee.documents
```

The architecture currently keeps these domains within the available model inventory, but high-volume systems should eventually move extremely large event collections to dedicated collections.

---

# 82. Current Known Implementation Notes

The following items should be reviewed during a dedicated code-quality pass.

## Payroll

LOP days must not be added directly as money into total deductions.

Use:

```text
lopDays
×
lopRate
=
lopAmount
```

and include `lopAmount` in monetary deductions.

## Customer

Review the index:

```text
instituteId + primaryEmail
```

because the email appears to be nested under:

```text
communication.primaryEmail
```

## CRMTask

Review the completion method because it currently assigns a dynamic:

```text
completionPercentage
```

without a corresponding root schema field.

## AttendanceEvent

Correction events should preferably preserve the original event and create a new correction/event chain.

## TestAttempt

`questionsVisited` should be updated consistently when answers are recorded or questions are visited.

## LiveSession

Large participant arrays can eventually become a scale bottleneck.

## Conversation

Large participant arrays can eventually become a scale bottleneck.

## Message

Large delivery/reaction arrays can eventually become a scale bottleneck.

## QRSession

Embedded scans can eventually become too large for very high-volume attendance.

## Geofence

Geospatial validation should combine geometry with security checks.

---

# 83. AI Integration Direction

AI can eventually support:

- Question generation
- Question explanation
- Assignment evaluation
- Student feedback
- Study recommendations
- CRM lead scoring
- CRM summaries
- Support-ticket summaries
- Employee review summaries
- Attendance anomaly detection
- Learning recommendations
- Personalized study plans

AI should not become the authoritative source of financial or attendance truth.

For example:

```text
AI detects possible attendance anomaly
        ↓
Human/system verification
        ↓
Authoritative attendance change
```

not:

```text
AI decides attendance
```

Similarly, AI can recommend a payroll anomaly but should not silently alter payroll.

---

# 84. Analytics Architecture

Analytics should generally be derived from authoritative records.

Examples:

Attendance analytics:

```text
Attendance
AttendanceEvent
```

Academic analytics:

```text
TestAttempt
Submission
Enrollment
```

Financial analytics:

```text
Invoice
Payment
Payroll
```

CRM analytics:

```text
Lead
Deal
Pipeline
CRMActivity
CRMTask
```

Gamification analytics:

```text
PointLedger
UserAchievement
Streak
```

The application should avoid treating dashboard counters as the sole source of truth.

---

# 85. Frontend Application Direction

The React/Vite/TypeScript frontend should be organized around domains.

Suggested high-level frontend areas:

```text
auth
dashboard
students
teachers
employees
departments
classes
attendance
tests
assignments
study-material
live-sessions
gamification
crm
communication
support
hr
finance
notifications
settings
admin
```

Redux Toolkit should hold client/application state.

RTK Query should handle API caching and server-state synchronization.

---

# 86. Role-Based Frontend

The UI should be permission-aware.

Examples:

Student:

```text
Dashboard
Classes
Assignments
Tests
Attendance
Study Materials
Live Sessions
Achievements
Leaderboard
Certificates
Payments
Notifications
```

Teacher:

```text
Dashboard
Classes
Students
Assignments
Tests
Attendance
Live Sessions
Announcements
Analytics
```

Employee:

```text
Dashboard
Attendance
Leave
Payroll
Documents
Performance
Profile
Notifications
```

HR:

```text
Employees
Departments
Leave
Attendance
Payroll
Salary Structures
Performance
Documents
Reports
```

Admin:

```text
Organization
Users
Roles
Academic
CRM
Finance
HR
Reports
Settings
Audit
```

Super Admin:

```text
Organizations
Platform users
Tenant management
System analytics
System configuration
Security
Audit
```

Exact permissions must come from backend authorization, not frontend assumptions.

---

# 87. API Design Philosophy

API endpoints should be resource-oriented.

Examples:

```text
/api/auth
/api/users
/api/students
/api/employees
/api/teachers
/api/classes
/api/attendance
/api/geofences
/api/qr-sessions
/api/tests
/api/questions
/api/test-attempts
/api/assignments
/api/submissions
/api/live-sessions
/api/leads
/api/customers
/api/contacts
/api/deals
/api/pipelines
/api/tickets
/api/messages
/api/invoices
/api/payments
/api/payroll
```

Nested routes can be used where relationships are meaningful.

---

# 88. Validation Strategy

Joi should validate API input.

Mongoose validation remains a second defensive layer.

This gives:

```text
Request validation
+
database validation
```

Do not rely only on frontend validation.

The frontend can be bypassed.

---

# 89. Error Handling

Use a consistent error format.

Example:

```json
{
  "success": false,
  "message": "Employee not found",
  "code": "EMPLOYEE_NOT_FOUND",
  "details": null
}
```

Production APIs should avoid leaking:

- Stack traces
- Database details
- Secret values
- Internal paths
- JWT data
- Provider credentials

---

# 90. API Response Philosophy

A consistent response structure is recommended:

```json
{
  "success": true,
  "message": "Employee retrieved successfully",
  "data": {}
}
```

For lists:

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

Pagination should be used for large datasets.

---

# 91. Pagination

Do not return thousands of records by default.

Use:

```text
page
limit
sort
filter
search
```

For extremely high-volume data, cursor pagination should eventually be considered.

Cursor pagination is especially appropriate for:

- Messages
- Audit logs
- Events
- Notification logs
- Attendance events
- CRM activity
- Ticket messages

---

# 92. Background Workers

Some operations should run asynchronously.

Examples:

```text
Notification delivery
Email
SMS
Push
Certificate generation
Report generation
Payroll exports
Analytics
Event processing
CRM automation
Expired session cleanup
Expired geofence handling
Token cleanup
```

The Event model provides a foundation for event-driven workers.

---

# 93. Scheduled Jobs

Scheduled processes can include:

```text
Expire tests
Expire certificates
Expire QR sessions
Process notifications
Generate payroll
Calculate streaks
Update leaderboards
Expire points
Process reminders
Clean expired sessions
Detect overdue CRM tasks
Process SLA escalation
```

Scheduled jobs must be idempotent.

---

# 94. Observability

Production deployment should eventually include:

- Structured logging
- Request IDs
- Correlation IDs
- Error tracking
- Metrics
- Health checks
- Database monitoring
- Queue monitoring
- Worker monitoring

Every important workflow should be traceable from:

```text
request
→ service
→ database
→ event
→ worker
```

using correlation IDs.

---

# 95. Security Threat Model

Important threats include:

- Cross-tenant data access
- Broken object-level authorization
- Token theft
- Refresh token reuse
- Brute-force login
- Fake GPS
- Mock location
- QR replay
- Duplicate payments
- Duplicate attendance
- Privilege escalation
- Sensitive document exposure
- ID enumeration
- Mass assignment
- File upload abuse
- Webhook replay
- Notification abuse

Security must be implemented at the backend service/API level.

---

# 96. Cross-Tenant Security

Never allow:

```text
User A from Institute A
```

to access:

```text
Employee from Institute B
```

simply because they know the employee's MongoDB `_id`.

Every resource lookup should be tenant constrained.

Example:

```js
Employee.findOne({
  _id: employeeId,
  instituteId: req.user.instituteId,
  isDeleted: false,
});
```

not:

```js
Employee.findById(employeeId);
```

unless the caller is an authorized super admin with explicit cross-tenant access.

---

# 97. Mass Assignment Protection

Do not blindly do:

```js
Model.findByIdAndUpdate(id, req.body)
```

for sensitive models.

Use a whitelist:

```text
allowed fields
```

Sensitive fields such as:

```text
role
instituteId
permissions
salary
legalHold
isDeleted
createdBy
```

must require explicit authorization.

---

# 98. File Upload Security

Employee documents, certificates, assignments, and study materials may contain files.

Uploads should eventually include:

- MIME validation
- Extension validation
- File size limits
- Virus/malware scanning
- Secure storage
- Access control
- Signed URLs
- Expiring access
- Audit logs

File URLs should not automatically imply public access.

---

# 99. Privacy Principles

Sensitive data should be minimized.

Examples:

Do not expose:

```text
full bank account number
raw device fingerprint
raw refresh token
unnecessary Aadhaar data
private employee documents
```

in ordinary list APIs.

Use masked values where appropriate.

---

# 100. Financial Integrity

Financial records need stronger consistency than normal CRUD.

Important rules:

- Do not silently modify successful payments
- Use refund records for refunds
- Preserve invoice snapshots
- Track payment allocation
- Reconcile gateway transactions
- Use idempotency
- Audit state changes
- Restrict deletion
- Preserve historical values

---

# 101. Attendance Integrity

Attendance must preserve evidence.

Important evidence can include:

```text
Timestamp
Location
Accuracy
Device
QR session
Geofence
Verification method
Network
User
Session
```

Do not overwrite historical evidence without creating an audit trail.

---

# 102. Academic Integrity

Assessment records should preserve:

```text
Test configuration
Attempt configuration snapshot
Questions
Answers
Submission time
Proctoring evidence
Grade
Reviewer
Result state
```

If a Test changes after an attempt, the attempt should not unexpectedly change historical meaning.

That is why TestAttempt contains configuration snapshots.

---

# 103. CRM Historical Integrity

Deals and activities should preserve historical state.

Examples:

If a deal moves:

```text
Qualification
→ Proposal
```

the stage history should preserve the transition.

If a lead becomes a customer, the original lead information should remain available for analytics and audit.

---

# 104. Gamification Integrity

Points should be treated as transactions.

Instead of:

```text
user.points = 100
```

as the only source of truth, maintain:

```text
PointLedger
```

with:

```text
+10 attendance
+20 test
-5 reversal
```

This allows audit and reversal.

---

# 105. Leaderboard Integrity

Leaderboards should be derived.

For example:

```text
PointLedger
    ↓
Aggregation
    ↓
Leaderboard
```

Do not manually alter leaderboard positions without an authoritative reason.

---

# 106. Certificate Verification

Certificate verification should be designed so that a verifier can provide:

```text
certificate number
```

or:

```text
verification code
```

and receive a safe verification result.

The public response should expose only the minimum information needed to verify authenticity.

---

# 107. Current Model Completion Status

Already designed/generated in the current project context include:

```text
AuditLog
Event
Test
Question
TestAttempt
LiveSession
Enrollment
AttendanceEvent
QRSession
Device
NotificationPreference
NotificationLog
Lead
Contact
Deal
Pipeline
CRMActivity
CRMTask
CRMNote
Conversation
Message
Ticket
TicketMessage
PointLedger
Achievement
Streak
SalaryStructure
PerformanceReview
Payment
Certificate
Customer
Employee
Geofence
```

The planned inventory also includes:

```text
UserAchievement
Leaderboard
EmployeeDocument
Invoice
```

and the other core models listed in the inventory.

Do not create duplicate versions of models that already exist.

---

# 108. Recommended Remaining Model Order

The original intended remaining sequence was:

```text
UserAchievement
Leaderboard
EmployeeDocument
Invoice
```

After those, the model inventory should be reviewed for completeness.

Existing out-of-order models such as:

```text
Streak
SalaryStructure
PerformanceReview
Payment
Certificate
Customer
Employee
Geofence
```

should not be regenerated.

---

# 109. Model Naming

Model files should use PascalCase where appropriate:

```text
Employee.js
Geofence.js
UserAchievement.js
EmployeeDocument.js
NotificationLog.js
```

The organization model currently uses:

```text
organization.js
```

If naming normalization is performed later, it must update imports consistently.

---

# 110. MongoDB References

Mongoose references should represent relationships, but references do not automatically enforce tenant ownership.

For example:

```js
ref: "Employee"
```

does not guarantee the referenced employee belongs to the same organization.

Therefore:

```text
Cross-tenant validation
```

belongs in services/controllers.

---

# 111. Ref Integrity

Before assigning:

```text
employee.departmentId
employee.salaryStructureId
payment.invoiceId
deal.pipelineId
ticket.customerId
```

the service should verify the referenced record belongs to the same organization.

Never assume that a valid ObjectId is an authorized ObjectId.

---

# 112. API Authorization Matrix Concept

A future permission system can use:

```text
resource
action
scope
```

Example:

```text
employee.read
employee.create
employee.update
employee.delete
employee.salary.read
employee.salary.update
employee.documents.read
employee.documents.manage
```

The backend should distinguish normal employee access from HR/admin access.

---

# 113. HR Privacy Boundaries

An employee may be allowed to see:

```text
Own profile
Own attendance
Own leave
Own payroll
Own documents
Own performance feedback
```

but not:

```text
Other employee salary
Other employee documents
HR private notes
Payroll of unrelated employees
```

unless explicitly authorized.

---

# 114. Student Privacy Boundaries

A student should generally access:

```text
Own profile
Own attendance
Own assignments
Own submissions
Own tests
Own results
Own achievements
Own certificates
Own payments
```

Teacher/admin permissions can expand access according to role.

---

# 115. Teacher Privacy Boundaries

Teachers can manage assigned academic resources but should not automatically receive access to:

```text
Payroll
Private employee documents
HR notes
Unrelated departments
```

unless granted permission.

---

# 116. Admin vs Super Admin

Admin:

```text
Organization-scoped
```

Super Admin:

```text
Platform-scoped
```

This distinction is fundamental to tenant security.

---

# 117. Future Integrations

Potential integrations include:

- Payment gateways
- Email providers
- SMS
- Push notification providers
- Video/live-session providers
- Cloud file storage
- Calendar
- Identity providers
- Accounting systems
- CRM systems
- AI providers

Integrations should be isolated behind services/adapters.

---

# 118. Environment Configuration

Sensitive configuration should live in environment variables.

Examples:

```text
MONGO_URI
JWT_SECRET
JWT_REFRESH_SECRET
COOKIE_SECRET
SMTP credentials
Payment gateway credentials
Storage credentials
AI credentials
```

Never commit secrets to Git.

---

# 119. Database Connection

`config/db.js` should:

- Connect to MongoDB
- Handle connection errors
- Handle reconnection behavior
- Avoid leaking credentials
- Log safe connection status

Production should use environment-driven connection strings.

---

# 120. Testing Strategy

Tests should exist at multiple levels.

## Unit

Test:

- Model methods
- Utility functions
- Validation
- Calculation services

## Integration

Test:

- API
- MongoDB
- Authentication
- Authorization
- Multi-tenancy

## Security

Test:

- Cross-tenant access
- Privilege escalation
- Token reuse
- Mass assignment
- File access

## Workflow

Test complete processes:

```text
Lead → Deal → Customer
Student → Test → Attempt → Result
Employee → Salary → Payroll → Payment
QR → Geofence → Attendance
```

---

# 121. Seed Data

Development seed data should include:

```text
Organization
Super admin
Admin
Teacher
Student
Employee
Department
Class
Test
Questions
Attendance
CRM lead
Customer
Deal
Pipeline
```

Seed data should never contain production credentials.

---

# 122. Migration Strategy

Schema changes should be treated as migrations.

Examples:

```text
Add field
Rename field
Backfill field
Create index
Remove deprecated field
```

For large collections, avoid blocking operations during peak traffic.

---

# 123. Backup Strategy

MongoDB production data should have:

- Automated backups
- Point-in-time recovery where available
- Backup testing
- Retention policy
- Disaster recovery plan

Backups are not useful unless restoration has been tested.

---

# 124. Disaster Recovery

The system should eventually define:

```text
RPO
RTO
Backup retention
Failover procedure
Database restoration
Secret restoration
File restoration
Queue recovery
```

Critical records include:

```text
Users
Attendance
Tests
Attempts
Payments
Payroll
Audit
CRM
Tickets
Documents
```

---

# 125. Deployment Architecture

A production architecture may eventually look like:

```text
Client
  ↓
HTTPS
  ↓
Reverse Proxy
  ↓
Node/Express API
  ↓
MongoDB

Background workers
  ↓
Event / Queue

File storage
  ↓
Secure object storage

Monitoring
  ↓
Logs + Metrics + Alerts
```

The exact infrastructure can remain flexible.

---

# 126. Performance Principles

Avoid:

```text
N+1 database queries
```

Use:

- Populate selectively
- Aggregation where appropriate
- Projection
- Pagination
- Compound indexes
- Caching
- Background processing

Do not populate large relationship graphs by default.

---

# 127. Caching

Potential cache targets:

```text
Organization settings
Permissions
Pipeline configuration
Achievement definitions
Leaderboard snapshots
Frequently accessed classes
Notification preferences
```

Cache invalidation must be event-driven or explicit.

Do not cache sensitive user-specific data without careful key isolation.

---

# 128. Event-Driven Architecture

The Event model provides a path toward:

```text
Domain events
→ workers
→ notifications
→ analytics
→ integrations
```

Examples:

```text
attendance.marked
test.completed
assignment.submitted
payment.success
payroll.approved
employee.created
deal.stage_changed
ticket.created
certificate.issued
achievement.earned
```

Each event should contain enough context for downstream processing without exposing secrets.

---

# 129. Example End-to-End Student Journey

```text
Lead
 ↓
Customer
 ↓
Student
 ↓
Enrollment
 ↓
Class
 ↓
Study Material
 ↓
Assignment
 ↓
Submission
 ↓
Test
 ↓
TestAttempt
 ↓
Attendance
 ↓
Achievement
 ↓
Points
 ↓
Leaderboard
 ↓
Certificate
 ↓
Payment / Invoice history
```

This demonstrates why the models are designed as a connected platform rather than isolated CRUD modules.

---

# 130. Example End-to-End Employee Journey

```text
User
 ↓
Employee
 ↓
Department
 ↓
Joining
 ↓
SalaryStructure
 ↓
Attendance
 ↓
Leave
 ↓
Payroll
 ↓
PerformanceReview
 ↓
EmployeeDocument
 ↓
Promotion / salary revision
 ↓
Notice period
 ↓
Exit
```

---

# 131. Example End-to-End CRM Journey

```text
Lead
 ↓
Qualification
 ↓
CRMActivity
 ↓
CRMTask
 ↓
Deal
 ↓
Pipeline stage changes
 ↓
Customer
 ↓
Invoice
 ↓
Payment
 ↓
Support Ticket
 ↓
Conversation
```

---

# 132. Example Attendance Fraud-Resistance Journey

```text
User authentication
 ↓
Device validation
 ↓
QR validation
 ↓
QR expiry
 ↓
Anti-replay
 ↓
Location capture
 ↓
GPS accuracy
 ↓
Mock-location detection
 ↓
Geofence geometry
 ↓
Session validation
 ↓
Duplicate check
 ↓
Attendance
 ↓
AttendanceEvent
 ↓
AuditLog
```

No individual signal should automatically be considered perfect proof.

---

# 133. Data Ownership

The platform should distinguish:

```text
Source of truth
Derived data
Cache
Snapshot
Audit record
Event
```

Examples:

```text
PointLedger = source of truth for point transactions
Leaderboard = derived ranking
TestAttempt = source of truth for an attempt
Test = configuration
Attempt configuration snapshot = historical snapshot
NotificationPreference = preference
NotificationLog = delivery history
```

This distinction is critical.

---

# 134. Snapshot Strategy

Historical records should capture important mutable information.

Examples:

```text
Invoice → customer billing snapshot
Payment → payer snapshot
TestAttempt → test configuration snapshot
Enrollment → academic snapshot
Certificate → recipient/academic snapshot
Ticket → requester snapshot
Deal → contact/product context
```

This prevents historical documents from changing when current profile data changes.

---

# 135. Soft Delete vs Archive

Soft delete means:

```text
Record is no longer active in normal queries.
```

Archive means:

```text
Record remains intentionally retained but is no longer operational.
```

They should not automatically be treated as identical.

---

# 136. Lifecycle State Machines

Important models have lifecycle states.

Examples:

Employee:

```text
probation
active
on_leave
notice_period
resigned
terminated
retired
```

Test:

```text
draft
scheduled
published
started
completed
closed
cancelled
archived
```

Payment:

```text
pending
processing
success
failed
cancelled
refunded
```

Ticket:

```text
open
in_progress
waiting
resolved
closed
```

State transitions should be controlled by service methods rather than arbitrary updates.

---

# 137. Why Model Methods Exist

Methods such as:

```text
activate()
archive()
softDelete()
restore()
markWon()
markLost()
approve()
reject()
```

provide guardrails.

However, complex multi-model operations should still live in services.

Example:

```text
paymentService.refund()
```

should coordinate:

```text
Payment
Invoice
Gateway
Event
AuditLog
```

rather than expecting a Payment model method to perform every external operation.

---

# 138. API Versioning

The API should eventually support:

```text
/api/v1/
```

This allows future changes without immediately breaking existing clients.

Breaking changes should result in a new API version or a controlled migration.

---

# 139. Logging Rules

Logs should include:

```text
timestamp
level
service
requestId
correlationId
userId
instituteId
action
duration
result
```

Logs should not include:

```text
password
JWT
refresh token
bank account secrets
raw security tokens
private document contents
```

---

# 140. Production Readiness Checklist

Before production:

```text
[ ] Environment secrets configured
[ ] MongoDB secured
[ ] Authentication tested
[ ] Refresh rotation tested
[ ] Rate limits configured
[ ] CORS restricted
[ ] Helmet enabled
[ ] Joi validation enabled
[ ] Tenant checks tested
[ ] Role authorization tested
[ ] Audit logging enabled
[ ] Error handling standardized
[ ] File uploads secured
[ ] Payment idempotency tested
[ ] Attendance anti-fraud tested
[ ] Database backups configured
[ ] Restore tested
[ ] Monitoring configured
[ ] Worker failures handled
[ ] Event retries configured
[ ] Indexes reviewed
[ ] Pagination implemented
[ ] Sensitive fields protected
[ ] Soft deletion tested
[ ] Legal hold tested
```

---

# 141. Development Rules for Future AI Assistants

Any AI working on PAISA should follow these rules.

## Rule 1

Do not invent a new model if the existing inventory already contains the required domain.

## Rule 2

Do not create duplicate models.

## Rule 3

Do not remove authentication or backend APIs while redesigning frontend UI.

## Rule 4

Preserve multi-tenancy.

## Rule 5

Every tenant-scoped query must include organization ownership.

## Rule 6

Do not expose sensitive fields.

## Rule 7

Do not replace service-layer workflows with arbitrary controller logic.

## Rule 8

Do not use frontend authorization as the security boundary.

## Rule 9

Use transactions for multi-record critical workflows.

## Rule 10

Preserve auditability.

## Rule 11

Use soft deletion where the model supports it.

## Rule 12

Respect legal holds.

## Rule 13

Use idempotency for retryable business operations.

## Rule 14

Do not treat cached statistics as authoritative truth.

## Rule 15

Do not change existing model semantics casually.

---

# 142. Model Creation Order

The agreed original model-building order was:

```text
1. AuditLog
2. Event
3. Test
4. Question
5. TestAttempt
6. LiveSession
7. Enrollment
8. AttendanceEvent
9. QRSession
10. Device
11. NotificationPreference
12. NotificationLog
13. Lead
14. Contact
15. Deal
16. Pipeline
17. CRMActivity
18. CRMTask
19. CRMNote
20. Conversation
21. Message
22. Ticket
23. TicketMessage
24. PointLedger
25. Achievement
26. UserAchievement
27. Leaderboard
28. Streak
29. SalaryStructure
30. PerformanceReview
31. EmployeeDocument
32. Invoice
33. Payment
```

During implementation, several models were generated out of order.

Already completed out of sequence:

```text
Streak
SalaryStructure
PerformanceReview
Payment
Certificate
Customer
Employee
Geofence
```

These should remain part of the project and should not be regenerated.

The remaining sequence should resume from missing models rather than repeating already completed models.

---

# 143. Current Strategic Product Scope

PAISA is intended to become a unified platform where an organization can manage:

```text
People
Academics
Attendance
Communication
CRM
Support
HR
Payroll
Finance
Gamification
Analytics
Security
```

The platform is intentionally broad.

The architecture should therefore prioritize:

```text
Consistency
Security
Tenant isolation
Auditability
Scalability
Workflow integrity
```

over simply adding more screens.

---

# 144. Final System Vision

The complete PAISA platform can be viewed as six major systems connected through events:

```text
                    PAISA
                      │
       ┌──────────────┼──────────────┐
       │              │              │
   EDUCATION         PEOPLE          CRM
       │              │              │
   Tests            Employee        Lead
   Classes          HR              Contact
   Assignments      Payroll         Deal
   Attendance       Leave           Customer
   Live Sessions    Performance     Pipeline
       │              │              │
       └──────────────┼──────────────┘
                      │
              COMMUNICATION
                      │
          Conversation / Message
          Notification / Ticket
                      │
                FINANCE
                      │
            Invoice / Payment
                      │
               GAMIFICATION
                      │
       Points / Achievement / Streak
                      │
              PLATFORM CORE
                      │
       User / Organization / Security
       Audit / Event / Device / Session
```

The platform's strongest architectural concept is not any individual model.

It is the connection between authoritative business records, events, audit trails, tenant boundaries, and role-based workflows.

---

# 145. Final Reference Summary

If another AI needs to understand PAISA quickly, the minimum mental model is:

```text
Organization
    ↓
User
    ↓
Role/Profile
    ├── Student
    ├── Teacher
    └── Employee

Academic
    ├── Class
    ├── Enrollment
    ├── Assignment
    ├── Submission
    ├── StudyMaterial
    ├── Test
    ├── Question
    ├── TestAttempt
    └── LiveSession

Attendance
    ├── Attendance
    ├── AttendanceEvent
    ├── QRSession
    ├── Device
    └── Geofence

Gamification
    ├── Achievement
    ├── UserAchievement
    ├── PointLedger
    ├── Streak
    └── Leaderboard

CRM
    ├── Lead
    ├── Contact
    ├── Customer
    ├── Deal
    ├── Pipeline
    ├── CRMActivity
    ├── CRMTask
    └── CRMNote

Communication
    ├── Conversation
    ├── Message
    ├── NotificationPreference
    └── NotificationLog

Support
    ├── Ticket
    └── TicketMessage

HR
    ├── Employee
    ├── SalaryStructure
    ├── Payroll
    ├── Leave
    ├── PerformanceReview
    └── EmployeeDocument

Finance
    ├── Invoice
    ├── Payment
    └── Certificate

Platform
    ├── Organization
    ├── User
    ├── RefreshSession
    ├── Device
    ├── AuditLog
    ├── Event
    └── counter
```

The guiding rule for future development is:

```text
Every important action should be:
tenant-aware,
permission-aware,
validated,
auditable,
idempotent where necessary,
secure,
and connected to the correct source of truth.
```

---

# 146. AI Handoff Prompt

The following section can be copied into another AI session together with the project source code.

> You are working on the PAISA platform.
>
> PAISA is a multi-tenant Node.js/Express/MongoDB/Mongoose backend with a React/Vite/TypeScript/Redux Toolkit/RTK Query frontend.
>
> The platform supports organizations/institutes, users, students, teachers, employees, departments, classes, enrollment, attendance, geofencing, QR attendance, devices, tests, questions, test attempts, assignments, submissions, study materials, live sessions, announcements, notifications, CRM, support, gamification, HR, payroll, finance, certificates, audit logs, and event-driven processing.
>
> The highest-level tenant entity is Organization. Most business models contain `instituteId`.
>
> Roles are:
>
> `super_admin`, `admin`, `teacher`, `student`, `hr`, `employee`.
>
> Authentication is handled through User. Employee and Teacher are domain profiles and must not automatically be treated as identical to User.
>
> Backend security uses JWT, HTTP-only cookies, Bearer fallback, bcrypt, Joi, Helmet, CORS, rate limiting, ownership checks, tenant isolation, soft deletion, and audit logging.
>
> Important architectural principles:
>
> 1. Never bypass tenant isolation.
> 2. Never trust frontend permissions.
> 3. Never expose sensitive fields.
> 4. Never mass-update sensitive fields from raw request bodies.
> 5. Use services for complex multi-model workflows.
> 6. Use transactions where consistency requires multiple writes.
> 7. Preserve audit history.
> 8. Use idempotency for payments, events, attendance, and retryable operations.
> 9. Treat derived statistics as caches, not authoritative truth.
> 10. Preserve historical snapshots for invoices, attempts, certificates, payments, and similar records.
>
> The main model domains are:
>
> Organization/User → identity and tenancy.
>
> Student/Teacher/Class/Enrollment → academics.
>
> Attendance/AttendanceEvent/QRSession/Device/Geofence → attendance verification.
>
> Test/Question/TestAttempt → assessment.
>
> Assignment/Submission/StudyMaterial/LiveSession → learning.
>
> Achievement/UserAchievement/PointLedger/Streak/Leaderboard → gamification.
>
> Lead/Contact/Customer/Deal/Pipeline/CRMActivity/CRMTask/CRMNote → CRM.
>
> Conversation/Message/NotificationPreference/NotificationLog → communication.
>
> Ticket/TicketMessage → support.
>
> Employee/SalaryStructure/Payroll/Leave/PerformanceReview/EmployeeDocument → HR.
>
> Invoice/Payment/Certificate → finance and credentialing.
>
> AuditLog/Event/RefreshSession/Device/counter → platform infrastructure.
>
> When modifying code, preserve existing backend/login APIs unless the requested task explicitly changes them.
>
> Do not create a new model if an existing model already represents the domain.
>
> Before changing a model, check its existing relationships, indexes, methods, static methods, query helpers, lifecycle, tenant fields, soft deletion, legal hold, and security requirements.
>
> If a requested feature spans multiple models, prefer a service-layer workflow rather than placing all business logic inside one Mongoose model.
>
> When generating code, preserve the existing project's naming conventions and import style.
>
> When a model already exists, modify it rather than generating a duplicate model.
>
> The platform should be treated as a production-grade multi-tenant system rather than a simple CRUD application.

---

# 147. End of PAISA Project Specification

This document is the consolidated technical/product context for the current PAISA project and should be kept alongside the source code as an AI/developer handoff reference.
