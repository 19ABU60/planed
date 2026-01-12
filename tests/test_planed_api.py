"""
PlanEd API Backend Tests
Tests for German teacher work plan management app
Features: Auth, Classes, Lessons, Holidays, Todos, Templates, Sharing, Documents, Statistics
"""
import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
API_URL = f"{BASE_URL}/api"

# Test credentials
TEST_EMAIL = "test@schule.de"
TEST_PASSWORD = "test123456"
TEST_NAME = "Test Lehrer"

# Unique test prefix for cleanup
TEST_PREFIX = f"TEST_{uuid.uuid4().hex[:8]}"


class TestHealthAndHolidays:
    """Test health check and German holidays endpoints (no auth required for holidays)"""
    
    def test_api_health(self):
        """Test API root endpoint"""
        response = requests.get(f"{API_URL}/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "running"
        assert "PlanEd API" in data["message"]
    
    def test_get_bundeslaender(self):
        """Test getting list of German states"""
        response = requests.get(f"{API_URL}/holidays/bundeslaender")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 9  # At least 9 Bundesländer
        
        # Check Rheinland-Pfalz is present (default)
        bundesland_ids = [b["id"] for b in data]
        assert "rheinland-pfalz" in bundesland_ids
        assert "bayern" in bundesland_ids
        
        # Verify structure
        for bundesland in data:
            assert "id" in bundesland
            assert "name" in bundesland
    
    def test_get_rheinland_pfalz_holidays(self):
        """Test getting school holidays for Rheinland-Pfalz (default Bundesland)"""
        response = requests.get(f"{API_URL}/holidays/school-holidays/rheinland-pfalz")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 4  # At least 4 holiday periods
        
        # Verify structure
        for holiday in data:
            assert "name" in holiday
            assert "start" in holiday
            assert "end" in holiday
    
    def test_get_bayern_holidays(self):
        """Test getting school holidays for Bayern"""
        response = requests.get(f"{API_URL}/holidays/school-holidays/bayern")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 5  # Bayern has more holiday periods
    
    def test_get_invalid_bundesland_holidays(self):
        """Test getting holidays for invalid Bundesland returns 404"""
        response = requests.get(f"{API_URL}/holidays/school-holidays/invalid-state")
        assert response.status_code == 404
    
    def test_get_public_holidays(self):
        """Test getting German public holidays"""
        response = requests.get(f"{API_URL}/holidays/public-holidays")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 10  # Multiple public holidays
        
        # Verify structure
        for holiday in data:
            assert "name" in holiday
            assert "date" in holiday


class TestAuthentication:
    """Test user registration and login"""
    
    def test_register_new_user(self):
        """Test user registration"""
        unique_email = f"{TEST_PREFIX}_register@test.de"
        response = requests.post(f"{API_URL}/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": f"{TEST_PREFIX} User"
        })
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == unique_email
        assert data["user"]["bundesland"] is not None  # Should have default bundesland
    
    def test_register_duplicate_email(self):
        """Test registration with duplicate email fails"""
        unique_email = f"{TEST_PREFIX}_dup@test.de"
        # First registration
        requests.post(f"{API_URL}/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "First User"
        })
        # Second registration with same email
        response = requests.post(f"{API_URL}/auth/register", json={
            "email": unique_email,
            "password": "testpass456",
            "name": "Second User"
        })
        assert response.status_code == 400
    
    def test_login_success(self):
        """Test successful login"""
        # First register
        unique_email = f"{TEST_PREFIX}_login@test.de"
        requests.post(f"{API_URL}/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Login Test User"
        })
        
        # Then login
        response = requests.post(f"{API_URL}/auth/login", json={
            "email": unique_email,
            "password": "testpass123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
    
    def test_login_invalid_credentials(self):
        """Test login with wrong password fails"""
        response = requests.post(f"{API_URL}/auth/login", json={
            "email": "nonexistent@test.de",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
    
    def test_get_current_user(self):
        """Test getting current user info"""
        # Register and get token
        unique_email = f"{TEST_PREFIX}_me@test.de"
        reg_response = requests.post(f"{API_URL}/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Me Test User"
        })
        token = reg_response.json()["access_token"]
        
        # Get current user
        response = requests.get(f"{API_URL}/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == unique_email


@pytest.fixture(scope="class")
def auth_session():
    """Create authenticated session for tests"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    
    # Register a test user
    unique_email = f"{TEST_PREFIX}_session@test.de"
    response = session.post(f"{API_URL}/auth/register", json={
        "email": unique_email,
        "password": "testpass123",
        "name": f"{TEST_PREFIX} Session User"
    })
    
    if response.status_code == 200:
        token = response.json()["access_token"]
        session.headers.update({"Authorization": f"Bearer {token}"})
    else:
        # Try login if already exists
        response = session.post(f"{API_URL}/auth/login", json={
            "email": unique_email,
            "password": "testpass123"
        })
        if response.status_code == 200:
            token = response.json()["access_token"]
            session.headers.update({"Authorization": f"Bearer {token}"})
        else:
            pytest.skip("Could not authenticate")
    
    return session


class TestSchoolYears:
    """Test school year CRUD operations"""
    
    def test_create_school_year(self, auth_session):
        """Test creating a school year"""
        response = auth_session.post(f"{API_URL}/school-years", json={
            "name": f"{TEST_PREFIX} 2025/26",
            "semester": "1. Halbjahr",
            "start_date": "2025-08-01",
            "end_date": "2026-01-31"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == f"{TEST_PREFIX} 2025/26"
        assert "id" in data
    
    def test_get_school_years(self, auth_session):
        """Test getting school years list"""
        response = auth_session.get(f"{API_URL}/school-years")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestClasses:
    """Test class/subject CRUD operations"""
    
    @pytest.fixture
    def school_year_id(self, auth_session):
        """Create a school year for class tests"""
        response = auth_session.post(f"{API_URL}/school-years", json={
            "name": f"{TEST_PREFIX} Class Test Year",
            "semester": "1. Halbjahr",
            "start_date": "2025-08-01",
            "end_date": "2026-01-31"
        })
        return response.json()["id"]
    
    def test_create_class(self, auth_session, school_year_id):
        """Test creating a class"""
        response = auth_session.post(f"{API_URL}/classes", json={
            "name": f"{TEST_PREFIX} 5a",
            "subject": "Mathematik",
            "color": "#3b82f6",
            "hours_per_week": 4,
            "school_year_id": school_year_id
        })
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == f"{TEST_PREFIX} 5a"
        assert data["subject"] == "Mathematik"
        assert "id" in data
    
    def test_get_classes(self, auth_session):
        """Test getting classes list"""
        response = auth_session.get(f"{API_URL}/classes")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_update_class(self, auth_session, school_year_id):
        """Test updating a class"""
        # Create class
        create_response = auth_session.post(f"{API_URL}/classes", json={
            "name": f"{TEST_PREFIX} Update Test",
            "subject": "Deutsch",
            "color": "#ef4444",
            "hours_per_week": 3,
            "school_year_id": school_year_id
        })
        class_id = create_response.json()["id"]
        
        # Update class
        response = auth_session.put(f"{API_URL}/classes/{class_id}", json={
            "name": f"{TEST_PREFIX} Updated",
            "subject": "Englisch",
            "color": "#22c55e",
            "hours_per_week": 5,
            "school_year_id": school_year_id
        })
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == f"{TEST_PREFIX} Updated"
        assert data["subject"] == "Englisch"
    
    def test_delete_class(self, auth_session, school_year_id):
        """Test deleting a class"""
        # Create class
        create_response = auth_session.post(f"{API_URL}/classes", json={
            "name": f"{TEST_PREFIX} Delete Test",
            "subject": "Kunst",
            "color": "#8b5cf6",
            "hours_per_week": 2,
            "school_year_id": school_year_id
        })
        class_id = create_response.json()["id"]
        
        # Delete class
        response = auth_session.delete(f"{API_URL}/classes/{class_id}")
        assert response.status_code == 200
        
        # Verify deletion
        get_response = auth_session.get(f"{API_URL}/classes")
        class_ids = [c["id"] for c in get_response.json()]
        assert class_id not in class_ids


class TestLessons:
    """Test lesson CRUD operations"""
    
    @pytest.fixture
    def class_subject_id(self, auth_session):
        """Create a class for lesson tests"""
        # Create school year
        year_response = auth_session.post(f"{API_URL}/school-years", json={
            "name": f"{TEST_PREFIX} Lesson Test Year",
            "semester": "1. Halbjahr",
            "start_date": "2025-08-01",
            "end_date": "2026-01-31"
        })
        school_year_id = year_response.json()["id"]
        
        # Create class
        class_response = auth_session.post(f"{API_URL}/classes", json={
            "name": f"{TEST_PREFIX} Lesson Class",
            "subject": "Physik",
            "color": "#f59e0b",
            "hours_per_week": 3,
            "school_year_id": school_year_id
        })
        return class_response.json()["id"]
    
    def test_create_lesson(self, auth_session, class_subject_id):
        """Test creating a lesson"""
        response = auth_session.post(f"{API_URL}/lessons", json={
            "class_subject_id": class_subject_id,
            "date": "2025-09-15",
            "topic": f"{TEST_PREFIX} Einführung Mechanik",
            "objective": "Grundlagen verstehen",
            "curriculum_reference": "LP 5.1",
            "educational_standards": "Kompetenz K1",
            "key_terms": "Kraft, Masse, Beschleunigung",
            "notes": "Experimente vorbereiten",
            "teaching_units": 2,
            "is_cancelled": False,
            "cancellation_reason": ""
        })
        assert response.status_code == 200
        data = response.json()
        assert data["topic"] == f"{TEST_PREFIX} Einführung Mechanik"
        assert data["teaching_units"] == 2
        assert "id" in data
    
    def test_get_lessons(self, auth_session):
        """Test getting lessons list"""
        response = auth_session.get(f"{API_URL}/lessons")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_update_lesson(self, auth_session, class_subject_id):
        """Test updating a lesson"""
        # Create lesson
        create_response = auth_session.post(f"{API_URL}/lessons", json={
            "class_subject_id": class_subject_id,
            "date": "2025-09-16",
            "topic": f"{TEST_PREFIX} Original Topic",
            "teaching_units": 1
        })
        lesson_id = create_response.json()["id"]
        
        # Update lesson
        response = auth_session.put(f"{API_URL}/lessons/{lesson_id}", json={
            "topic": f"{TEST_PREFIX} Updated Topic",
            "teaching_units": 3
        })
        assert response.status_code == 200
        data = response.json()
        assert data["topic"] == f"{TEST_PREFIX} Updated Topic"
        assert data["teaching_units"] == 3
    
    def test_delete_lesson(self, auth_session, class_subject_id):
        """Test deleting a lesson"""
        # Create lesson
        create_response = auth_session.post(f"{API_URL}/lessons", json={
            "class_subject_id": class_subject_id,
            "date": "2025-09-17",
            "topic": f"{TEST_PREFIX} Delete Test",
            "teaching_units": 1
        })
        lesson_id = create_response.json()["id"]
        
        # Delete lesson
        response = auth_session.delete(f"{API_URL}/lessons/{lesson_id}")
        assert response.status_code == 200
    
    def test_copy_lesson(self, auth_session, class_subject_id):
        """Test copying a lesson to new date"""
        # Create lesson
        create_response = auth_session.post(f"{API_URL}/lessons", json={
            "class_subject_id": class_subject_id,
            "date": "2025-09-18",
            "topic": f"{TEST_PREFIX} Copy Source",
            "teaching_units": 2
        })
        lesson_id = create_response.json()["id"]
        
        # Copy lesson
        response = auth_session.post(f"{API_URL}/lessons/{lesson_id}/copy?new_date=2025-09-25")
        assert response.status_code == 200
        data = response.json()
        assert data["topic"] == f"{TEST_PREFIX} Copy Source"
        assert data["date"] == "2025-09-25"
        assert data["id"] != lesson_id  # New ID


class TestTodos:
    """Test todo CRUD operations"""
    
    def test_create_todo(self, auth_session):
        """Test creating a todo"""
        response = auth_session.post(f"{API_URL}/todos", json={
            "title": f"{TEST_PREFIX} Arbeitsblätter kopieren",
            "description": "Für nächste Woche",
            "due_date": "2025-09-20",
            "priority": "high"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == f"{TEST_PREFIX} Arbeitsblätter kopieren"
        assert data["priority"] == "high"
        assert data["is_completed"] == False
    
    def test_get_todos(self, auth_session):
        """Test getting todos list"""
        response = auth_session.get(f"{API_URL}/todos")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_update_todo_complete(self, auth_session):
        """Test marking todo as complete"""
        # Create todo
        create_response = auth_session.post(f"{API_URL}/todos", json={
            "title": f"{TEST_PREFIX} Complete Test",
            "priority": "medium"
        })
        todo_id = create_response.json()["id"]
        
        # Mark as complete
        response = auth_session.put(f"{API_URL}/todos/{todo_id}", json={
            "is_completed": True
        })
        assert response.status_code == 200
        data = response.json()
        assert data["is_completed"] == True
    
    def test_delete_todo(self, auth_session):
        """Test deleting a todo"""
        # Create todo
        create_response = auth_session.post(f"{API_URL}/todos", json={
            "title": f"{TEST_PREFIX} Delete Test",
            "priority": "low"
        })
        todo_id = create_response.json()["id"]
        
        # Delete todo
        response = auth_session.delete(f"{API_URL}/todos/{todo_id}")
        assert response.status_code == 200


class TestTemplates:
    """Test template CRUD operations"""
    
    def test_create_template(self, auth_session):
        """Test creating a template"""
        response = auth_session.post(f"{API_URL}/templates", json={
            "name": f"{TEST_PREFIX} Einführungsstunde",
            "subject": "Mathematik",
            "topic": "Grundlagen",
            "objective": "Einführung in das Thema",
            "curriculum_reference": "LP 5.1",
            "teaching_units": 2
        })
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == f"{TEST_PREFIX} Einführungsstunde"
        assert data["use_count"] == 0
    
    def test_get_templates(self, auth_session):
        """Test getting templates list"""
        response = auth_session.get(f"{API_URL}/templates")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_use_template(self, auth_session):
        """Test using a template increments use count"""
        # Create template
        create_response = auth_session.post(f"{API_URL}/templates", json={
            "name": f"{TEST_PREFIX} Use Test",
            "subject": "Deutsch",
            "topic": "Grammatik",
            "teaching_units": 1
        })
        template_id = create_response.json()["id"]
        
        # Use template
        response = auth_session.post(f"{API_URL}/templates/{template_id}/use")
        assert response.status_code == 200
        data = response.json()
        assert data["use_count"] == 1


class TestNotifications:
    """Test notification endpoints"""
    
    def test_get_notifications(self, auth_session):
        """Test getting notifications list"""
        response = auth_session.get(f"{API_URL}/notifications")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_unread_count(self, auth_session):
        """Test getting unread notification count"""
        response = auth_session.get(f"{API_URL}/notifications/unread-count")
        assert response.status_code == 200
        data = response.json()
        assert "count" in data
        assert isinstance(data["count"], int)


class TestHistory:
    """Test history/activity log endpoints"""
    
    def test_get_history(self, auth_session):
        """Test getting history list"""
        response = auth_session.get(f"{API_URL}/history")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestSearch:
    """Test global search functionality"""
    
    def test_search_lessons(self, auth_session):
        """Test searching for lessons"""
        response = auth_session.get(f"{API_URL}/search?q=Mathematik")
        assert response.status_code == 200
        data = response.json()
        assert "lessons" in data
        assert "classes" in data
        assert "templates" in data
        assert "todos" in data


class TestUserSettings:
    """Test user settings update"""
    
    def test_update_bundesland(self, auth_session):
        """Test updating user's Bundesland setting"""
        response = auth_session.put(f"{API_URL}/auth/settings", json={
            "bundesland": "bayern"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["bundesland"] == "bayern"
        
        # Reset to default
        auth_session.put(f"{API_URL}/auth/settings", json={
            "bundesland": "rheinland-pfalz"
        })


class TestStatistics:
    """Test statistics endpoint"""
    
    def test_get_statistics(self, auth_session):
        """Test getting statistics for a class"""
        # Create school year
        year_response = auth_session.post(f"{API_URL}/school-years", json={
            "name": f"{TEST_PREFIX} Stats Year",
            "semester": "1. Halbjahr",
            "start_date": "2025-08-01",
            "end_date": "2026-01-31"
        })
        school_year_id = year_response.json()["id"]
        
        # Create class
        class_response = auth_session.post(f"{API_URL}/classes", json={
            "name": f"{TEST_PREFIX} Stats Class",
            "subject": "Biologie",
            "color": "#10b981",
            "hours_per_week": 3,
            "school_year_id": school_year_id
        })
        class_id = class_response.json()["id"]
        
        # Get statistics
        response = auth_session.get(f"{API_URL}/statistics/{class_id}")
        assert response.status_code == 200
        data = response.json()
        assert "total_available_hours" in data
        assert "used_hours" in data
        assert "remaining_hours" in data
        assert "hours_by_weekday" in data
        assert "completion_percentage" in data


class TestSharing:
    """Test sharing functionality"""
    
    def test_get_my_shares(self, auth_session):
        """Test getting shares I created"""
        response = auth_session.get(f"{API_URL}/shares/my-shares")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_shared_with_me(self, auth_session):
        """Test getting classes shared with me"""
        response = auth_session.get(f"{API_URL}/shares/shared-with-me")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestDocuments:
    """Test document management"""
    
    def test_get_documents(self, auth_session):
        """Test getting documents list"""
        response = auth_session.get(f"{API_URL}/documents")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
