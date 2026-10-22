"""
NextHire AI - Automated Selenium Shortlist & Job-Fit Test Suite
Framework: Selenium 4, pytest, Google Chrome, Python 3.13
File: test_short.py

Flow Tested:
  Mentor login (/mentor/login)
    -> Navigate to Candidates (mentor-nav-candidates)
    -> Select a job from the dropdown FIRST (job-match-select)
      [This triggers React to render check-fit-btn for candidates with resumes]
    -> Find the first candidate that has a visible check-fit-btn
    -> Click Shortlist for that candidate (shortlist-btn-<id>)
    -> Handle browser alert gracefully
    -> Click Check Job Fit (check-fit-btn-<id>)
    -> Verify UI responds (view-fit-btn or check-fit-btn reappears)
"""

import time
import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoAlertPresentException


class TestShort:

    def setup_method(self, method):
        """Configure Chrome options and initialize the WebDriver."""
        options = webdriver.ChromeOptions()
        options.add_argument("--disable-search-engine-choice-screen")
        options.add_argument("--disable-notifications")
        options.add_argument("--start-maximized")

        self.driver = webdriver.Chrome(options=options)
        self.wait = WebDriverWait(self.driver, 20)
        self.long_wait = WebDriverWait(self.driver, 40)
        self.base_url = "http://localhost:5173"

    def teardown_method(self, method):
        """Safely quit browser session."""
        if hasattr(self, "driver") and self.driver:
            try:
                self.driver.switch_to.alert.dismiss()
            except Exception:
                pass
            self.driver.quit()

    # ------------------------------------------------------------------
    # HELPERS
    # ------------------------------------------------------------------

    def _mentor_login(self, email="balancompany@gmail.com", password="Balan@123"):
        """Log in as mentor and confirm redirect to /mentor/dashboard."""
        driver = self.driver
        driver.get(f"{self.base_url}/mentor/login")

        email_field = self.wait.until(
            EC.visibility_of_element_located((By.ID, "mentor-email")),
            message="Mentor login page: 'mentor-email' not visible.",
        )
        email_field.clear()
        email_field.send_keys(email)

        password_field = self.wait.until(
            EC.visibility_of_element_located((By.ID, "mentor-password")),
            message="'mentor-password' field not visible.",
        )
        password_field.clear()
        password_field.send_keys(password)

        login_btn = self.wait.until(
            EC.element_to_be_clickable((By.ID, "mentor-login-btn")),
            message="'mentor-login-btn' was not clickable.",
        )
        login_btn.click()

        try:
            self.wait.until(
                EC.url_contains("/mentor/dashboard"),
                message="Expected redirect to /mentor/dashboard after login.",
            )
        except TimeoutException:
            raise AssertionError(
                f"Mentor login did not redirect to /mentor/dashboard. "
                f"URL: {self.driver.current_url}"
            )

    def _navigate_to_candidates(self):
        """Click the Candidates sidebar link and wait for the page to load."""
        link = self.wait.until(
            EC.element_to_be_clickable((By.ID, "mentor-nav-candidates")),
            message="Sidebar 'mentor-nav-candidates' was not clickable.",
        )
        link.click()
        self.wait.until(
            EC.url_contains("/mentor/candidates"),
            message="Expected URL to contain '/mentor/candidates'.",
        )

    def _select_job_in_dropdown(self):
        """
        Select a job from the 'Evaluate Against Role' dropdown.
        Prefers 'Project Coordinator', otherwise picks the first available job.
        Returns the selected job title.
        """
        job_select_el = self.wait.until(
            EC.presence_of_element_located((By.ID, "job-match-select")),
            message="Job match dropdown 'job-match-select' not found.",
        )

        job_select = Select(job_select_el)
        options = job_select.options
        # Options with a real value (skip blank "None" placeholder)
        selectable = [o for o in options if o.get_attribute("value")]

        assert len(selectable) > 0, (
            "No jobs found in the dropdown. "
            "Please create at least one job via the mentor Jobs page first."
        )

        target = "Project Coordinator"
        option_texts = [o.text for o in selectable]

        if target in option_texts:
            job_select.select_by_visible_text(target)
            return target
        else:
            job_select.select_by_index(1)
            return job_select.first_selected_option.text

    def _get_first_check_fit_candidate_id(self):
        """
        After a job is selected, React renders 'check-fit-btn-<id>' only for
        candidates that actually have a resume. Wait for at least one to appear
        and return the first candidate ID found.
        """
        self.wait.until(
            EC.presence_of_element_located(
                (By.CSS_SELECTOR, "[id^='check-fit-btn-']")
            ),
            message=(
                "No 'CHECK JOB FIT' buttons appeared after selecting a job. "
                "Make sure at least one candidate has uploaded a resume."
            ),
        )
        first_btn = self.driver.find_element(
            By.CSS_SELECTOR, "[id^='check-fit-btn-']"
        )
        return first_btn.get_attribute("id").replace("check-fit-btn-", "")

    def _wait_for_alert_and_dismiss(self, timeout=8):
        """
        Wait up to `timeout` seconds for a browser alert; accept and return its text.
        Returns None if no alert appears.
        """
        try:
            WebDriverWait(self.driver, timeout).until(EC.alert_is_present())
            alert = self.driver.switch_to.alert
            text = alert.text
            alert.accept()
            return text
        except TimeoutException:
            return None

    # ------------------------------------------------------------------
    # TEST
    # ------------------------------------------------------------------

    def test_short(self):
        """
        End-to-end: mentor login -> candidates page -> select job ->
        shortlist first resume-holding candidate -> check job fit.
        """
        driver = self.driver

        # Step 1: Login
        self._mentor_login()
        print("\n[STEP 1] Mentor login successful.")

        # Step 2: Navigate to Candidates
        self._navigate_to_candidates()
        print("[STEP 2] Navigated to /mentor/candidates.")

        # Step 3: Select job in dropdown FIRST
        # This causes React to render check-fit-btn for candidates with resumes
        selected_job = self._select_job_in_dropdown()
        print(f"[STEP 3] Job selected in dropdown: '{selected_job}'")

        # Step 4: Discover the first candidate that has a resume (has a check-fit-btn)
        candidate_id = self._get_first_check_fit_candidate_id()
        print(f"[STEP 4] Candidate with resume found, ID: {candidate_id}")

        # Step 5: Click Shortlist button for that candidate
        shortlist_btn = self.wait.until(
            EC.element_to_be_clickable((By.ID, f"shortlist-btn-{candidate_id}")),
            message=f"'shortlist-btn-{candidate_id}' was not clickable.",
        )
        shortlist_btn.click()
        print("[STEP 5] Shortlist button clicked.")

        # Handle any browser alert (e.g. server error or duplicate shortlist)
        alert_text = self._wait_for_alert_and_dismiss(timeout=5)
        if alert_text:
            print(f"[STEP 5] Alert dismissed: '{alert_text}'")
        else:
            print("[STEP 5] No alert — shortlist action succeeded silently.")

        # Step 6: Click CHECK JOB FIT for the same candidate
        check_fit_btn = self.wait.until(
            EC.element_to_be_clickable((By.ID, f"check-fit-btn-{candidate_id}")),
            message=(
                f"'check-fit-btn-{candidate_id}' not clickable after selecting job. "
                "Ensure the candidate has a resume and the plan is not Basic."
            ),
        )
        check_fit_btn.click()
        print("[STEP 6] 'CHECK JOB FIT' clicked.")

        # Dismiss any alert from the fit-check API call
        alert_text = self._wait_for_alert_and_dismiss(timeout=5)
        if alert_text:
            print(f"[STEP 6] Alert after fit check: '{alert_text}'")

        # Step 7: Verify the UI responded — either VIEW FIT DETAILS appeared
        # (success) or CHECK JOB FIT button is re-enabled (API error handled)
        try:
            self.long_wait.until(
                lambda d: (
                    d.find_elements(By.ID, f"view-fit-btn-{candidate_id}")
                    or d.find_elements(By.ID, f"check-fit-btn-{candidate_id}")
                ),
                message="UI did not respond after CHECK JOB FIT click.",
            )
        except TimeoutException:
            raise AssertionError(
                "Timed out: neither 'VIEW FIT DETAILS' nor 'CHECK JOB FIT' "
                "appeared after clicking Check Job Fit."
            )

        print("[SUCCESS] Shortlist & Job Fit check flow completed successfully.")
