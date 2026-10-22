"""
NextHire AI - Automated Selenium Registration Test Suite
Framework: Selenium 4, pytest, Google Chrome, Python 3.13
File: test_registration.py
Target Location: C:\\Users\\andre\\Desktop\\Testing\\test_registration.py
"""

import time
import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException


class TestRegistration:

    def setup_method(self):
        """Configure Chrome options and initialize the WebDriver."""
        options = webdriver.ChromeOptions()
        options.add_argument("--disable-search-engine-choice-screen")
        options.add_argument("--disable-notifications")
        options.add_argument("--start-maximized")

        self.driver = webdriver.Chrome(options=options)
        self.wait = WebDriverWait(self.driver, 15)
        self.base_url = "http://localhost:5173"

    def teardown_method(self):
        """Safely quit browser session."""
        if hasattr(self, "driver") and self.driver:
            self.driver.quit()

    def _fill_and_submit_registration(self, name: str, email: str, password: str):
        """Helper to fill out verified registration inputs and submit."""
        driver = self.driver

        # 1. Wait for registration form elements to be visible
        name_field = self.wait.until(
            EC.visibility_of_element_located((By.ID, "signup-name")),
            message="Registration form field 'signup-name' was not found.",
        )
        email_field = self.wait.until(
            EC.visibility_of_element_located((By.ID, "signup-email")),
            message="Registration form field 'signup-email' was not found.",
        )
        password_field = self.wait.until(
            EC.visibility_of_element_located((By.ID, "signup-password")),
            message="Registration form field 'signup-password' was not found.",
        )
        confirm_field = self.wait.until(
            EC.visibility_of_element_located((By.ID, "signup-confirm")),
            message="Registration form field 'signup-confirm' was not found.",
        )

        # 2. Populate inputs
        name_field.clear()
        name_field.send_keys(name)

        email_field.clear()
        email_field.send_keys(email)

        password_field.clear()
        password_field.send_keys(password)

        confirm_field.clear()
        confirm_field.send_keys(password)

        # 3. Submit form
        submit_btn = self.wait.until(
            EC.element_to_be_clickable((By.ID, "signup-submit-btn")),
            message="Submit button 'signup-submit-btn' was not clickable.",
        )
        submit_btn.click()

    def _verify_registration_success(self, registered_name: str):
        """Verify successful registration outcome or fail with descriptive error message."""
        driver = self.driver

        def outcome_checker(d):
            # 1. Direct navigation to dashboard via AuthContext login redirect
            if "/dashboard" in d.current_url:
                return ("dashboard", d.current_url)

            # 2. In-page success screen
            goto_btns = d.find_elements(By.ID, "goto-dashboard-btn")
            if goto_btns and goto_btns[0].is_displayed():
                return ("success_btn", goto_btns[0])

            # 3. Success text in body
            try:
                body_text = d.find_element(By.TAG_NAME, "body").text.lower()
                if "you're all set" in body_text or "account has been created successfully" in body_text:
                    return ("success_text", True)
            except Exception:
                pass

            # 4. Check for inline validation or API errors
            error_elements = d.find_elements(
                By.CSS_SELECTOR,
                "p.text-red-400, .bg-red-500\\/10 p, p[class*='text-red']"
            )
            for err in error_elements:
                try:
                    if err.is_displayed():
                        text = err.text.strip()
                        if text:
                            return ("error", text)
                except Exception:
                    pass

            return False

        try:
            result = self.wait.until(outcome_checker)
        except TimeoutException:
            raise AssertionError(
                f"Timed out waiting for registration outcome. Current URL: {driver.current_url}"
            )

        if isinstance(result, tuple) and result[0] == "error":
            raise AssertionError(f"Registration failed with application error: '{result[1]}'")

        # If on success screen, click through to dashboard
        if isinstance(result, tuple) and result[0] == "success_btn":
            result[1].click()

        # Confirm dashboard is reached
        self.wait.until(
            EC.url_contains("/dashboard"),
            message="Expected to navigate to '/dashboard' after registration."
        )
        assert "/dashboard" in driver.current_url, (
            f"Expected URL to contain '/dashboard', but got '{driver.current_url}'"
        )

    def test_registration(self):
        """
        Tests the end-to-end registration flow starting from the portal:
        /portal -> Select Candidate -> /sign-in -> Click 'Create one free' -> /sign-up -> Submit -> /dashboard
        """
        driver = self.driver
        portal_url = f"{self.base_url}/portal"
        driver.get(portal_url)

        # Step 1: On Portal page (/portal), select Candidate / Student portal
        # Candidate card is an anchor link pointing to /sign-in
        candidate_portal_link = self.wait.until(
            EC.element_to_be_clickable(
                (By.CSS_SELECTOR, "a[href='/sign-in']")
            ),
            message="Candidate portal link (a[href='/sign-in']) not found or not clickable on /portal.",
        )
        candidate_portal_link.click()

        # Step 2: On Sign-In page (/sign-in), verify sign-in form loaded, then click 'Create one free'
        self.wait.until(
            EC.visibility_of_element_located((By.ID, "signin-email")),
            message="Sign-in email field 'signin-email' was not found on /sign-in.",
        )

        create_account_link = self.wait.until(
            EC.element_to_be_clickable(
                (By.XPATH, "//a[@href='/sign-up' and contains(., 'Create one free')]")
            ),
            message="'Create one free' link to /sign-up was not found on /sign-in.",
        )
        create_account_link.click()

        # Step 3: Verify navigation to /sign-up
        self.wait.until(
            EC.url_contains("/sign-up"),
            message="Expected URL to be '/sign-up' after clicking 'Create one free'.",
        )

        # Step 4: Generate unique credentials meeting application validation rules
        unique_timestamp = int(time.time() * 1000)
        test_name = "Maria Selenium"
        unique_email = f"maria.selenium.{unique_timestamp}@example.com"
        test_password = "MariaTest@123"

        # Step 5: Fill in form and submit
        self._fill_and_submit_registration(test_name, unique_email, test_password)

        # Step 6: Verify registration outcome and transition to dashboard
        self._verify_registration_success(test_name)

        print(f"\n[SUCCESS] E2E Registration from /portal passed! Registered: {unique_email}")

    def test_registration_direct_route(self):
        """
        Tests registration directly on the dedicated registration route:
        /sign-up -> Fill Form -> Submit -> /dashboard
        """
        driver = self.driver
        signup_url = f"{self.base_url}/sign-up"
        driver.get(signup_url)

        unique_timestamp = int(time.time() * 1000)
        test_name = "John Direct"
        unique_email = f"john.direct.{unique_timestamp}@example.com"
        test_password = "DirectTest@123"

        self._fill_and_submit_registration(test_name, unique_email, test_password)
        self._verify_registration_success(test_name)

        print(f"\n[SUCCESS] Direct /sign-up Registration passed! Registered: {unique_email}")
