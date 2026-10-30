# All Ages College School Library App: Specification

**Purpose:** let students find a book, **log a book request first**, collect it from the librarian, read it, and return it, with the school keeping a clear record.
**Fits into:** the existing All Ages College portal (same logins, roles, bell alerts, SMS/WhatsApp to parents, Supabase database).
**Version:** 1.0 (planning) · **Owner:** School administration · **Status:** Ready to build

---

## 1. Who uses it (roles)

| Role | Who | What they do |
|---|---|---|
| Student | Pupils Creche to SSS 3 | Search books, request, read, return |
| Librarian | A staff member (uses a Teacher or Admin login) | Approve requests, issue, receive returns, manage books |
| Parent | Guardian | See what their child borrowed and what is overdue |
| Admin | School management | Everything the librarian does, plus reports and settings |

## 2. User stories

Format: *As a [role], I want [what], so that [benefit].*

| ID | Role | Story (What) | Benefit (Why) |
|---|---|---|---|
| US-01 | Student | Search and browse books by title, author, subject or class | Find a book quickly |
| US-02 | Student | See whether a book is available or on loan | Avoid a wasted trip |
| US-03 | Student | Log a **request** for a book before taking it out | Reserve it and get it approved |
| US-04 | Student | See the status of my requests (Pending, Approved, Rejected, Collected) | Know when to collect |
| US-05 | Student | See my borrowed books and due dates | Return on time |
| US-06 | Student | Read e-books and PDFs on screen | Read without waiting |
| US-07 | Student | Get a bell alert when my request is approved or a book is almost due | Not forget |
| US-08 | Librarian | See all pending requests in one list | Process them in order |
| US-09 | Librarian | Approve or reject a request with a reason | Control who borrows what |
| US-10 | Librarian | Issue an approved book and set the due date | Keep an accurate loan record |
| US-11 | Librarian | Record a return and the book's condition | Know stock and damage |
| US-12 | Librarian | Add, edit and remove books (one by one or CSV import) | Keep the catalogue current |
| US-13 | Parent | See my child's borrowed and overdue books | Support reading and returns |
| US-14 | Admin | See reports: most borrowed, overdue, lost or damaged | Plan and buy books |
| US-15 | Admin | Set loan rules (days allowed, books per student, fines if any) | School policy is applied the same way every time |

## 3. Key rule: request first

A student **cannot** take a book out without a logged and approved request.
Flow: **Search → Request → Librarian approves → Student collects (librarian issues) → Read → Return → Librarian confirms.**

Book loan states: `Available → Requested → Approved → On loan → Returned` (or `Overdue`, `Lost`, `Damaged`, `Rejected`, `Cancelled`).

## 4. Requirements

### 4.1 Functional (FR)

| ID | Requirement | Story |
|---|---|---|
| FR-01 | Catalogue of books with title, author, subject, class level, ISBN (optional), copies, shelf location, cover image, type (Print / E-book) | US-01, 12 |
| FR-02 | Search and filter by title, author, subject, class, availability | US-01, 02 |
| FR-03 | Show copies available and copies on loan | US-02 |
| FR-04 | Student logs a request: book, pick-up date, optional note | US-03 |
| FR-05 | Block a request when no copy is available (offer "Join waiting list") | US-03 |
| FR-06 | Block a request when the student is over their loan limit or has an overdue book | US-03, 15 |
| FR-07 | Librarian queue of pending requests; approve or reject with reason | US-08, 09 |
| FR-08 | Issue an approved book: sets due date (default 7 days, from settings) and reduces available copies | US-10 |
| FR-09 | Record a return: condition (Good, Damaged, Lost) and increases available copies | US-11 |
| FR-10 | "My books" page: requests, current loans, history | US-04, 05 |
| FR-11 | E-books and PDFs open in the app for signed-in students only | US-06 |
| FR-12 | Bell alerts: request approved/rejected, due in 2 days, overdue | US-07 |
| FR-13 | Parent view of their own child's loans only | US-13 |
| FR-14 | Librarian/admin add, edit, delete books; CSV import | US-12 |
| FR-15 | Reports: most borrowed, overdue list, lost/damaged, export CSV | US-14 |
| FR-16 | Settings: loan days, max books per student, renewals allowed, fine per day (optional) | US-15 |
| FR-17 | Optional: notify parent by SMS/WhatsApp for overdue books (reuses the Message parents feature) | US-13 |
| FR-18 | Audit trail: who approved, issued and received each book, and when | US-10, 11 |

### 4.2 Non-functional (NFR)

| ID | Area | Requirement |
|---|---|---|
| NFR-01 | Performance | Search results in under 2 seconds for up to 5,000 books on a normal phone connection |
| NFR-02 | Availability | 99% monthly uptime (hosted on Vercel and Supabase) |
| NFR-03 | Security | Sign-in required. Students see only their own loans; parents only their children's; only librarian/admin can approve, issue or return (enforced by database rules, not only the screen) |
| NFR-04 | Privacy | Loan history is never shown to other students or the public |
| NFR-05 | Usability | Works on a phone first; a student can log a request in 3 taps after finding the book; text readable at default size |
| NFR-06 | Accessibility | Keyboard usable, clear labels, sufficient colour contrast |
| NFR-07 | Offline | Catalogue viewable offline once loaded (installed app); requests need internet |
| NFR-08 | Data | Daily automatic database backup; no loan record is hard-deleted (mark as removed) |
| NFR-09 | Maintainability | Reuse the existing portal code, one record format, documented setup |
| NFR-10 | Cost | Runs on the current free/low-cost hosting; no new paid service required |

## 5. The 5 W's and How (summary)

| Question | Answer |
|---|---|
| **Who** | Students (borrow), librarian (issue/return), parents (view), admin (rules, reports) |
| **What** | A catalogue plus a request, approve, issue, return workflow with alerts and reports |
| **Why** | Stop lost books, know who has what, save the librarian's time, encourage reading |
| **How** | A new "Library" module inside the school portal using the same login and database |
| **When** | Build in 6 weeks (Section 10). Used every school day; due-date alerts run daily |
| **Where** | On phones and computers via the school website and the installed app; books are collected at the school library |

## 6. Features (grouped)

1. **Catalogue:** search, filters, cover images, availability, class-level tags.
2. **Request:** log a request, waiting list, cancel a request.
3. **Librarian desk:** pending queue, approve/reject, issue, return, mark lost/damaged.
4. **My books:** requests, current loans with due dates, history.
5. **E-library:** read PDFs and e-books on screen.
6. **Alerts:** bell and (optional) SMS/WhatsApp.
7. **Reports and settings:** most borrowed, overdue, loan rules, CSV export.

## 7. Acceptance criteria (Given / When / Then)

**AC-01 Search (US-01, 02)**
- Given I am signed in as a student, when I type "Mathematics" in search, then I see books matching the title, author or subject, each showing Available or On loan.

**AC-02 Request (US-03, FR-04)**
- Given a book has at least one available copy and I have no overdue books, when I press "Request this book" and choose a pick-up date, then a request is saved as Pending and I see it in My books.

**AC-03 Request blocked: no copy (FR-05)**
- Given all copies are on loan, when I open the book, then "Request" is replaced by "Join waiting list" and no request is created.

**AC-04 Request blocked: limit or overdue (FR-06)**
- Given I already have the maximum number of books or one overdue book, when I try to request, then I see a clear message explaining why and no request is created.

**AC-05 Approve (US-09)**
- Given a Pending request, when the librarian presses Approve, then the status becomes Approved, a copy is held for the student, and the student gets a bell alert.

**AC-06 Reject (US-09)**
- Given a Pending request, when the librarian rejects it and types a reason, then the status becomes Rejected and the student sees the reason on the bell.

**AC-07 Issue (US-10, FR-08)**
- Given an Approved request, when the librarian presses "Issue" and the student is present, then the loan starts, the due date is today plus the loan days, and available copies reduce by 1.

**AC-08 No issue without approval (core rule)**
- Given a student has no Approved request for a book, when the librarian tries to issue it, then the system refuses and says a request must be approved first.

**AC-09 Return (US-11, FR-09)**
- Given a book is On loan, when the librarian records the return as Good, then the loan closes, available copies increase by 1 and the book shows in the student's history.

**AC-10 Damaged or lost (FR-09)**
- Given a book is returned damaged or reported lost, when the librarian records it, then the book is marked accordingly, copies are adjusted and the admin report lists it.

**AC-11 Due and overdue alerts (US-07, FR-12)**
- Given a loan is due in 2 days, when the daily check runs, then the student gets a bell alert; and when the due date passes, then it shows as Overdue to the student, the librarian and the parent.

**AC-12 Privacy (NFR-03, 04)**
- Given I am signed in as a student or parent, when I try to open another child's loans (by link or search), then I see nothing and no data is returned.

**AC-13 E-book (US-06)**
- Given an E-book with a file, when a signed-in student presses Read, then the file opens on screen; when I am not signed in, then I am asked to sign in.

**AC-14 Catalogue import (US-12)**
- Given a CSV with title, author, subject and copies, when the librarian imports it, then valid rows are added and invalid rows are listed with the row number and reason.

**AC-15 Parent view (US-13)**
- Given I am a parent, when I open Library, then I see only my own children's current loans, due dates and overdue books.

## 8. Error and negative test cases

| ID | Scenario | Expected result |
|---|---|---|
| ET-01 | Request a book that has no copies left | Request refused; waiting-list option shown |
| ET-02 | Request the same book twice while one request is open | Refused: "You already have a request for this book" |
| ET-03 | Student over the loan limit | Refused with the limit shown |
| ET-04 | Student with an overdue book tries a new request | Refused until the book is returned |
| ET-05 | Issue a book with no approved request | Refused (AC-08) |
| ET-06 | Two students request the last copy at once | Only one succeeds; the other joins the waiting list |
| ET-07 | Return a book that is not on loan | Refused: "This book is not on loan" |
| ET-08 | Pick-up date in the past | Field error, request not saved |
| ET-09 | Student opens a librarian page by typing the address | Access denied |
| ET-10 | Student tries to read another child's loans through the database | Returns nothing (database rule) |
| ET-11 | CSV with missing title or non-numeric copies | Row rejected with row number, other rows imported |
| ET-12 | Internet drops while sending a request | Clear message; nothing half-saved; user can retry |
| ET-13 | Delete a book that has an open loan | Blocked: "Return the book first" |
| ET-14 | Approve an already approved/rejected request | No change; message shown |
| ET-15 | E-book file missing or broken | Friendly message; librarian is told |

## 9. Checklist

**Before build**
- [ ] School confirms loan rules: days allowed (default 7), books per student (default 2), renewals (default 1), fines (default none)
- [ ] Choose the librarian (a staff login with Librarian access)
- [ ] Collect the first list of books (title, author, subject, class, copies, shelf) in a CSV
- [ ] Decide which e-books or PDFs may be shared (copyright respected)

**During build**
- [ ] Database tables and access rules for books, requests, loans
- [ ] Student pages: search, book page, request, My books
- [ ] Librarian pages: queue, issue, return, books manager, CSV import
- [ ] Parent page, alerts, reports
- [ ] Test all acceptance criteria and error cases above

**Before launch**
- [ ] All AC-01 to AC-15 pass
- [ ] All ET cases pass
- [ ] Librarian and two teachers trained (30 minutes)
- [ ] Students shown how to request (one class assembly)
- [ ] Backup confirmed

**After launch**
- [ ] First 2 weeks: daily check of problems and feedback box
- [ ] Review reports at the end of the first term

## 10. Timeframe and milestones (6 weeks)

| Milestone | Week | Deliverable | Done when |
|---|---|---|---|
| M1 Plan agreed | 1 | Rules confirmed, book list collected | School signs off this document |
| M2 Catalogue | 2 | Books database, search, book page, CSV import | AC-01, AC-02 (view part), AC-14 pass |
| M3 Request and approve | 3 | Request form, librarian queue, approve/reject | AC-02 to AC-06, ET-01 to ET-04, ET-08, ET-14 pass |
| M4 Issue and return | 4 | Issue, return, due dates, condition | AC-07 to AC-10, ET-05, 06, 07, 13 pass |
| M5 Alerts, parent, reports | 5 | Bell alerts, parent view, reports, e-book reader | AC-11, 12, 13, 15, ET-09, 10, 15 pass |
| M6 Test and launch | 6 | Full test, training, go-live | All checks in Section 9 ticked |

**Achievability:** every item reuses parts already in the portal (logins and roles, bell alerts, file upload, CSV import, parent linking, SMS/WhatsApp), so the build is realistic for a small team in 6 weeks. Scope that can wait for version 2: fines and payments, barcode/QR scanning, book reviews, reading challenges.

## 11. Risks and answers

| Risk | Answer |
|---|---|
| Books not returned | Overdue alerts to student and parent; no new request while overdue |
| Librarian too busy | One queue, approve in one tap, CSV import for books |
| Students without phones | Request at the library desk: the librarian can log a request on their behalf |
| Copyright of e-books | Only upload books the school may share; students sign in to read |

## 12. Definition of done

The feature is done when its acceptance criteria and error tests pass, the access rules are verified (students and parents see only their own loans), the librarian has tested it with real books, and this document's checklist is ticked.
