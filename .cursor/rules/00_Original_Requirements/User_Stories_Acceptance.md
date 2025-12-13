# User Stories & Acceptance Criteria

## Story 1: The "Unprepared" Candidate
**As a** candidate,
**I want** to take the voice exam,
**So that** I can prove my communication skills.

* **Acceptance Criteria 1:** When I click "Show Question", the microphone MUST activate immediately.
* **Acceptance Criteria 2:** I cannot see the question text before the recording logic is initialized.
* **Acceptance Criteria 3:** If I try to refresh the page during the exam, I should be warned or the attempt should be flagged.

## Story 2: The "Blind" Reviewer
**As a** technical reviewer,
**I want** to evaluate candidates based on skills only,
**So that** I am not biased by their salary requests.

* **Acceptance Criteria 1:** When I log in as a Reviewer, I see the candidate list.
* **Acceptance Criteria 2:** When I open Candidate X, the "Salary Expectation" field is either invisible or blurred.
* **Acceptance Criteria 3:** I can listen to the audio answers and rate them 1-5 stars.

## Story 3: The Busy HR Manager
**As an** Admin,
**I want** to filter 500 applicants to find the top 5,
**So that** I save time.

* **Acceptance Criteria 1:** I can select "Age > 27" AND "Score > 80%" in the filter bar.
* **Acceptance Criteria 2:** The list updates instantly (AJAX/React State).
* **Acceptance Criteria 3:** I can export this filtered list to Excel/CSV with one click.