#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, timedelta
import uuid

class PlanEdAPITester:
    def __init__(self, base_url="https://smart-excel-viewer.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test data storage
        self.school_year_id = None
        self.class_id = None
        self.lesson_id = None

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f", Response: {response.text[:100]}"
            
            self.log_test(name, success, details)
            
            if success:
                try:
                    return response.json()
                except:
                    return {}
            return None

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return None

    def test_user_registration(self):
        """Test user registration"""
        test_email = f"test_{datetime.now().strftime('%H%M%S')}@test.de"
        data = {
            "email": test_email,
            "password": "Test1234!",
            "name": "Test Lehrer"
        }
        
        result = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data
        )
        
        if result:
            self.token = result.get('access_token')
            self.user_id = result.get('user', {}).get('id')
            return True
        return False

    def test_user_login(self):
        """Test user login with provided credentials"""
        data = {
            "email": "lehrer@test.de",
            "password": "Test1234!"
        }
        
        result = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data
        )
        
        if result:
            self.token = result.get('access_token')
            self.user_id = result.get('user', {}).get('id')
            return True
        return False

    def test_get_user_profile(self):
        """Test getting user profile"""
        result = self.run_test(
            "Get User Profile",
            "GET",
            "auth/me",
            200
        )
        return result is not None

    def test_create_school_year(self):
        """Test creating a school year"""
        data = {
            "name": "2025/2026",
            "semester": "1. Halbjahr",
            "start_date": "2025-08-01",
            "end_date": "2026-01-31"
        }
        
        result = self.run_test(
            "Create School Year",
            "POST",
            "school-years",
            200,
            data
        )
        
        if result:
            self.school_year_id = result.get('id')
            return True
        return False

    def test_get_school_years(self):
        """Test getting school years"""
        result = self.run_test(
            "Get School Years",
            "GET",
            "school-years",
            200
        )
        return result is not None

    def test_create_class(self):
        """Test creating a class"""
        if not self.school_year_id:
            self.log_test("Create Class", False, "No school year ID available")
            return False
            
        data = {
            "name": "6a",
            "subject": "Deutsch",
            "color": "#3b82f6",
            "hours_per_week": 4,
            "school_year_id": self.school_year_id
        }
        
        result = self.run_test(
            "Create Class",
            "POST",
            "classes",
            200,
            data
        )
        
        if result:
            self.class_id = result.get('id')
            return True
        return False

    def test_get_classes(self):
        """Test getting classes"""
        result = self.run_test(
            "Get Classes",
            "GET",
            "classes",
            200
        )
        return result is not None

    def test_create_lesson(self):
        """Test creating a lesson"""
        if not self.class_id:
            self.log_test("Create Lesson", False, "No class ID available")
            return False
            
        data = {
            "class_subject_id": self.class_id,
            "date": "2025-08-15",
            "topic": "Einführung in die Bruchrechnung",
            "objective": "Schüler verstehen Grundlagen der Brüche",
            "curriculum_reference": "LP 6.1",
            "educational_standards": "Mathematik Grundlagen",
            "key_terms": "Bruch, Zähler, Nenner",
            "notes": "Verwendung von Anschauungsmaterial",
            "teaching_units": 2,
            "is_cancelled": False,
            "cancellation_reason": ""
        }
        
        result = self.run_test(
            "Create Lesson",
            "POST",
            "lessons",
            200,
            data
        )
        
        if result:
            self.lesson_id = result.get('id')
            return True
        return False

    def test_get_lessons(self):
        """Test getting lessons"""
        result = self.run_test(
            "Get Lessons",
            "GET",
            "lessons",
            200
        )
        return result is not None

    def test_update_lesson(self):
        """Test updating a lesson"""
        if not self.lesson_id:
            self.log_test("Update Lesson", False, "No lesson ID available")
            return False
            
        data = {
            "topic": "Erweiterte Bruchrechnung",
            "objective": "Schüler können Brüche addieren und subtrahieren"
        }
        
        result = self.run_test(
            "Update Lesson",
            "PUT",
            f"lessons/{self.lesson_id}",
            200,
            data
        )
        return result is not None

    def test_get_statistics(self):
        """Test getting statistics"""
        if not self.class_id:
            self.log_test("Get Statistics", False, "No class ID available")
            return False
            
        result = self.run_test(
            "Get Statistics",
            "GET",
            f"statistics/{self.class_id}",
            200
        )
        return result is not None

    def test_export_endpoints(self):
        """Test export endpoints"""
        if not self.class_id:
            self.log_test("Export Excel", False, "No class ID available")
            self.log_test("Export Word", False, "No class ID available")
            self.log_test("Export PDF", False, "No class ID available")
            return False
        
        # Test Excel export
        excel_result = self.run_test(
            "Export Excel",
            "GET",
            f"export/excel/{self.class_id}",
            200
        )
        
        # Test Word export
        word_result = self.run_test(
            "Export Word",
            "GET",
            f"export/word/{self.class_id}",
            200
        )
        
        # Test PDF export
        pdf_result = self.run_test(
            "Export PDF",
            "GET",
            f"export/pdf/{self.class_id}",
            200
        )
        
        return excel_result is not None and word_result is not None and pdf_result is not None

    def test_ai_suggestions(self):
        """Test AI suggestions endpoint"""
        data = {
            "subject": "Deutsch",
            "grade": "6a",
            "curriculum_topic": "Grammatik",
            "previous_topics": ["Nomen", "Verben"]
        }
        
        result = self.run_test(
            "AI Suggestions",
            "POST",
            "ai/suggestions",
            200,
            data
        )
        return result is not None

    def test_api_root(self):
        """Test API root endpoint"""
        result = self.run_test(
            "API Root",
            "GET",
            "",
            200
        )
        return result is not None

    def cleanup_test_data(self):
        """Clean up test data"""
        if self.lesson_id:
            self.run_test(
                "Delete Lesson",
                "DELETE",
                f"lessons/{self.lesson_id}",
                200
            )
        
        if self.class_id:
            self.run_test(
                "Delete Class",
                "DELETE",
                f"classes/{self.class_id}",
                200
            )
        
        if self.school_year_id:
            self.run_test(
                "Delete School Year",
                "DELETE",
                f"school-years/{self.school_year_id}",
                200
            )

    def run_all_tests(self):
        """Run all tests in sequence"""
        print(f"🚀 Starting PlanEd API Tests")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Test API root
        self.test_api_root()
        
        # Test authentication flow
        if not self.test_user_registration():
            # If registration fails, try login with existing credentials
            if not self.test_user_login():
                print("❌ Authentication failed, stopping tests")
                return False
        
        self.test_get_user_profile()
        
        # Test school year management
        self.test_create_school_year()
        self.test_get_school_years()
        
        # Test class management
        self.test_create_class()
        self.test_get_classes()
        
        # Test lesson management
        self.test_create_lesson()
        self.test_get_lessons()
        self.test_update_lesson()
        
        # Test statistics
        self.test_get_statistics()
        
        # Test export functionality
        self.test_export_endpoints()
        
        # Test AI suggestions
        self.test_ai_suggestions()
        
        # Cleanup
        self.cleanup_test_data()
        
        return True

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print(f"📊 Test Summary")
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        # Show failed tests
        failed_tests = [t for t in self.test_results if not t['success']]
        if failed_tests:
            print(f"\n❌ Failed Tests:")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = PlanEdAPITester()
    
    try:
        success = tester.run_all_tests()
        tester.print_summary()
        
        return 0 if success else 1
        
    except KeyboardInterrupt:
        print("\n⚠️  Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Unexpected error: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())