"""
NextHire AI - Automated Selenium Job Description Test Suite
Framework: Selenium 4, pytest, Google Chrome, Python 3.13
File: test_job.py

Flow Tested:
  Mentor login (/mentor/login)
    -> Navigate to Jobs via sidebar (mentor-nav-jobs)
    -> Click Create Job button (job-create-btn)
    -> Fill modal form (job-title, job-department, job-location,
       job-type, job-experience, job-skills, job-description)
    -> Submit (job-submit-btn)
    -> Verify new job card appears in the list
"""

import time
import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException


class TestJob:

    def setup_method(self, method):
        options = webdriver.ChromeOptions()
        options.add_argument("--disable-search-engine-choice-screen")
        options.add_argument("--disable-notifications")
        options.add_argument("--start-maximized")
        self.driver = webdriver.Chrome(options=options)
        self.wait = WebDriverWait(self.driver, 15)
        self.long_wait = WebDriverWait(self.driver, 30)
        self.base_url = "http://localhost:5173"

    def teardown_method(self, method):
        if hasattr(self, "driver") and self.driver:
            self.driver.quit()

    # ------------------------------------------------------------------
    # HELPERS
    # ------------------------------------------------------------------

    def _mentor_login(self, email="balancompany@gmail.com", password="Balan@123"):
        """Log in as a Mentor and confirm redirect to /mentor/dashboard."""
        driver = self.driver
        driver.get(f"{self.base_url}/mentor/login")

        email_field = self.wait.until(
            EC.visibility_of_element_located((By.ID, "mentor-email")),
            message="Mentor login page did not load: 'mentor-email' not visible.",
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
            message="Mentor login button 'mentor-login-btn' was not clickable.",
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
                f"URL: {driver.current_url}"
            )

    def _navigate_to_jobs(self):
        """Click the Jobs nav link in the mentor sidebar."""
        jobs_link = self.wait.until(
            EC.element_to_be_clickable((By.ID, "mentor-nav-jobs")),
            message="Mentor sidebar Jobs link (mentor-nav-jobs) was not clickable.",
        )
        jobs_link.click()
        self.wait.until(
            EC.url_contains("/mentor/jobs"),
            message="Expected URL to contain '/mentor/jobs' after clicking Jobs nav.",
        )

    def _open_create_job_modal(self):
        """Click Create Job and wait for the modal form to appear."""
        create_btn = self.wait.until(
            EC.element_to_be_clickable((By.ID, "job-create-btn")),
            message="'Create Job' button (job-create-btn) was not clickable.",
        )
        create_btn.click()
        self.wait.until(
            EC.visibility_of_element_located((By.ID, "job-title")),
            message="Create Job modal did not open: 'job-title' not visible.",
        )

    def _fill_job_form(self, title, department, location, job_type, experience, skills, description):
        """Fill all fields inside the Create Job modal."""
        driver = self.driver

        title_field = driver.find_element(By.ID, "job-title")
        title_field.clear()
        title_field.send_keys(title)

        dept_field = driver.find_element(By.ID, "job-department")
        dept_field.clear()
        dept_field.send_keys(department)

        loc_field = driver.find_element(By.ID, "job-location")
        loc_field.clear()
        loc_field.send_keys(location)

        Select(driver.find_element(By.ID, "job-type")).select_by_visible_text(job_type)

        exp_field = driver.find_element(By.ID, "job-experience")
        exp_field.clear()
        exp_field.send_keys(experience)

        skills_field = driver.find_element(By.ID, "job-skills")
        skills_field.clear()
        skills_field.send_keys(skills)

        desc_field = driver.find_element(By.ID, "job-description")
        desc_field.clear()
        desc_field.send_keys(description)

    def _submit_and_verify(self, title):
        """Click Save Job and verify the new job card appears in the list."""
        submit_btn = self.wait.until(
            EC.element_to_be_clickable((By.ID, "job-submit-btn")),
            message="'Save Job' button (job-submit-btn) was not clickable.",
        )
        submit_btn.click()

        # Modal should close (job-title input disappears)
        self.wait.until(
            EC.invisibility_of_element_located((By.ID, "job-title")),
            message="Create Job modal did not close after submission.",
        )

        # New job card with the title must be visible
        try:
            self.long_wait.until(
                EC.visibility_of_element_located(
                    (By.XPATH, f"//h3[contains(text(), '{title}')]")
                ),
                message=f"Job card for '{title}' did not appear in the job list.",
            )
        except TimeoutException:
            raise AssertionError(
                f"After submitting, job card for '{title}' was not found in the list."
            )

    # ------------------------------------------------------------------
    # TEST: End-to-End Job Creation
    # ------------------------------------------------------------------

    def test_job(self):
        """
        Full E2E test: Mentor login -> Jobs page -> Create Job modal
        -> Fill form -> Submit -> Verify job card in list.
        """
        unique_id = int(time.time())
        job_title = f"Project Coordinator {unique_id}"

        # Step 1: Mentor Login
        self._mentor_login()
        print("\n[STEP 1] Mentor login successful.")

        # Step 2: Navigate to Jobs
        self._navigate_to_jobs()
        print("[STEP 2] Navigated to /mentor/jobs.")

        # Step 3: Open Create Job modal
        self._open_create_job_modal()
        print("[STEP 3] Create Job modal opened.")

        # Step 4: Fill the form
        self._fill_job_form(
            title=job_title,
            department="CS",
            location="Kochi",
            job_type="Full-time",
            experience="4 years",
            skills="React, Java",
            description="Full time job overseeing project delivery and team coordination.",
        )
        print("[STEP 4] Job form filled.")

        # Step 5: Submit and verify
        self._submit_and_verify(job_title)
        print(f"[SUCCESS] Job '{job_title}' created and visible in the job list.")
