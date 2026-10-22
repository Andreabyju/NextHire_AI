

import time
import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException


class TestLogin:

    def setup_method(self, method):
        options = webdriver.ChromeOptions()
        options.add_argument("--disable-search-engine-choice-screen")
        options.add_argument("--disable-notifications")
        options.add_argument("--start-maximized")
        self.driver = webdriver.Chrome(options=options)
        self.wait = WebDriverWait(self.driver, 15)
        self.base_url = "http://localhost:5173"

    def teardown_method(self, method):
        if hasattr(self, "driver") and self.driver:
            self.driver.quit()

    def _open_signin(self):
        self.driver.get(f"{self.base_url}/sign-in")
        self.wait.until(
            EC.visibility_of_element_located((By.ID, "signin-email")),
            message="Sign-in page did not load: 'signin-email' input not visible.",
        )

    def _fill_and_submit(self, email: str, password: str):
        driver = self.driver
        email_field = driver.find_element(By.ID, "signin-email")
        email_field.clear()
        email_field.send_keys(email)
        password_field = driver.find_element(By.ID, "signin-password")
        password_field.clear()
        password_field.send_keys(password)
        password_field.send_keys(Keys.RETURN)

    def test_login_valid(self):
        """Valid credentials redirect to /dashboard."""
        self._open_signin()
        self._fill_and_submit("maria@gmail.com", "maria@123")
        try:
            self.wait.until(
                EC.url_contains("/dashboard"),
                message="Expected redirect to '/dashboard' after valid login.",
            )
        except TimeoutException:
            raise AssertionError(
                f"Valid login did not redirect to /dashboard. URL: {self.driver.current_url}"
            )
        assert "/dashboard" in self.driver.current_url
        print("\n[SUCCESS] Valid login redirected to /dashboard correctly.")

    def test_login_invalid_password(self):
        """Wrong password -> stays on /sign-in and shows error message."""
        self._open_signin()
        self._fill_and_submit("maria@gmail.com", "WrongPassword999!")
        time.sleep(1.5)
        assert "/sign-in" in self.driver.current_url, (
            f"Expected to stay on /sign-in after bad password, got: {self.driver.current_url}"
        )
        try:
            error_el = self.wait.until(
                EC.visibility_of_element_located(
                    (By.CSS_SELECTOR, "p.text-xs.text-red-400")
                ),
                message="Expected a visible error message after wrong password.",
            )
        except TimeoutException:
            raise AssertionError("No error message appeared after wrong password.")
        assert error_el.text.strip(), "Error element visible but contains no text."
        print(f"\n[SUCCESS] Invalid password showed error: '{error_el.text}'")

    def test_login_empty_fields(self):
        """Empty form submission shows inline validation errors."""
        self._open_signin()
        submit_btn = self.wait.until(
            EC.element_to_be_clickable((By.ID, "signin-submit-btn")),
            message="'signin-submit-btn' was not clickable.",
        )
        submit_btn.click()
        try:
            error = self.wait.until(
                EC.visibility_of_element_located(
                    (By.CSS_SELECTOR, "p.text-xs.text-red-400")
                ),
                message="Expected inline validation error after empty submit.",
            )
        except TimeoutException:
            raise AssertionError(
                "No inline validation errors appeared after submitting empty form."
            )
        assert error.is_displayed()
        print(f"\n[SUCCESS] Empty form triggered validation: '{error.text}'")
