"""
PlanEd Feature Tests - Iteration 7
Tests for:
1. Auth endpoints (/api/auth/login, /api/auth/me)
2. Mathe Schulbücher API (/api/mathe/schulbuecher) - 24 books
3. Mathe Lehrplan Struktur (/api/mathe/struktur) - Klassenstufen 5/6, 7/8, 9/10
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "abusse@gmx.net"
TEST_PASSWORD = "LASP2026!"


class TestAuthEndpoints:
    """Test authentication endpoints"""
    
    def test_login_success(self):
        """Test successful login with valid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "access_token" in data, "No access_token in response"
        assert "user" in data, "No user in response"
        assert data["user"]["email"] == TEST_EMAIL
        assert len(data["access_token"]) > 0
        print(f"✓ Login successful for {TEST_EMAIL}")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "wrong@example.com", "password": "wrongpass"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Invalid credentials correctly rejected")
    
    def test_auth_me_endpoint(self):
        """Test /api/auth/me returns current user info"""
        # First login to get token
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        # Test /api/auth/me
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200, f"Auth/me failed: {response.text}"
        
        data = response.json()
        assert data["email"] == TEST_EMAIL
        assert "id" in data
        assert "name" in data
        print(f"✓ /api/auth/me returned user: {data['name']}")
    
    def test_auth_me_without_token(self):
        """Test /api/auth/me without token returns 401"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ /api/auth/me correctly requires authentication")


class TestMatheSchulbuecher:
    """Test Mathe Schulbücher API - should return 24 books + 1 'kein_schulbuch'"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        self.token = login_response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_schulbuecher_returns_25_books(self):
        """Test that /api/mathe/schulbuecher returns 25 books (24 + kein_schulbuch)"""
        response = requests.get(
            f"{BASE_URL}/api/mathe/schulbuecher",
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "schulbuecher" in data
        
        books = data["schulbuecher"]
        assert len(books) == 25, f"Expected 25 books, got {len(books)}"
        print(f"✓ Mathe Schulbücher API returns {len(books)} books")
    
    def test_schulbuecher_klassenstufe_5_6(self):
        """Test filtering by Klassenstufe 5/6"""
        response = requests.get(
            f"{BASE_URL}/api/mathe/schulbuecher",
            params={"klassenstufe": "5/6"},
            headers=self.headers
        )
        assert response.status_code == 200
        
        books = response.json()["schulbuecher"]
        # Should have: sekundo_5, sekundo_6, schnittpunkt_5, schnittpunkt_6, 
        # mathe_live_5, mathe_live_6, neue_wege_5, neue_wege_6, kein_schulbuch
        assert len(books) == 9, f"Expected 9 books for 5/6, got {len(books)}"
        
        # Verify expected books are present
        book_ids = [b["id"] for b in books]
        expected_ids = ["sekundo_5", "sekundo_6", "schnittpunkt_5", "schnittpunkt_6",
                       "mathe_live_5", "mathe_live_6", "neue_wege_5", "neue_wege_6", "kein_schulbuch"]
        for expected_id in expected_ids:
            assert expected_id in book_ids, f"Missing book: {expected_id}"
        
        print(f"✓ Klassenstufe 5/6 returns correct 9 books")
    
    def test_schulbuecher_klassenstufe_7_8(self):
        """Test filtering by Klassenstufe 7/8"""
        response = requests.get(
            f"{BASE_URL}/api/mathe/schulbuecher",
            params={"klassenstufe": "7/8"},
            headers=self.headers
        )
        assert response.status_code == 200
        
        books = response.json()["schulbuecher"]
        assert len(books) == 9, f"Expected 9 books for 7/8, got {len(books)}"
        
        # Verify new books are present (Mathe Live 7-8, Neue Wege 7-8)
        book_ids = [b["id"] for b in books]
        assert "mathe_live_7" in book_ids, "Missing mathe_live_7"
        assert "mathe_live_8" in book_ids, "Missing mathe_live_8"
        assert "neue_wege_7" in book_ids, "Missing neue_wege_7"
        assert "neue_wege_8" in book_ids, "Missing neue_wege_8"
        
        print(f"✓ Klassenstufe 7/8 returns correct 9 books including new Mathe Live and Neue Wege")
    
    def test_schulbuecher_klassenstufe_9_10(self):
        """Test filtering by Klassenstufe 9/10"""
        response = requests.get(
            f"{BASE_URL}/api/mathe/schulbuecher",
            params={"klassenstufe": "9/10"},
            headers=self.headers
        )
        assert response.status_code == 200
        
        books = response.json()["schulbuecher"]
        assert len(books) == 9, f"Expected 9 books for 9/10, got {len(books)}"
        
        # Verify new books are present (Mathe Live 9-10, Neue Wege 9-10)
        book_ids = [b["id"] for b in books]
        assert "mathe_live_9" in book_ids, "Missing mathe_live_9"
        assert "mathe_live_10" in book_ids, "Missing mathe_live_10"
        assert "neue_wege_9" in book_ids, "Missing neue_wege_9"
        assert "neue_wege_10" in book_ids, "Missing neue_wege_10"
        
        print(f"✓ Klassenstufe 9/10 returns correct 9 books including new Mathe Live and Neue Wege")
    
    def test_schulbuecher_contains_all_verlage(self):
        """Test that all 4 publishers are represented"""
        response = requests.get(
            f"{BASE_URL}/api/mathe/schulbuecher",
            headers=self.headers
        )
        assert response.status_code == 200
        
        books = response.json()["schulbuecher"]
        verlage = set(b["verlag"] for b in books if b["verlag"])
        
        expected_verlage = {"Westermann", "Klett", "Cornelsen", "Schroedel"}
        assert expected_verlage == verlage, f"Missing publishers: {expected_verlage - verlage}"
        
        print(f"✓ All 4 publishers present: {verlage}")


class TestMatheLehrplanStruktur:
    """Test Mathe Lehrplan Struktur API"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token before each test"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        self.token = login_response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_struktur_returns_correct_klassenstufen(self):
        """Test that /api/mathe/struktur returns 5/6, 7/8, 9/10"""
        response = requests.get(
            f"{BASE_URL}/api/mathe/struktur",
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data["fach"] == "Mathematik"
        assert data["bundesland"] == "RLP"
        assert "struktur" in data
        
        klassenstufen = list(data["struktur"].keys())
        expected = ["5/6", "7/8", "9/10"]
        assert sorted(klassenstufen) == sorted(expected), f"Expected {expected}, got {klassenstufen}"
        
        print(f"✓ Mathe Struktur returns correct Klassenstufen: {klassenstufen}")
    
    def test_struktur_has_kompetenzbereiche(self):
        """Test that each Klassenstufe has Kompetenzbereiche"""
        response = requests.get(
            f"{BASE_URL}/api/mathe/struktur",
            headers=self.headers
        )
        assert response.status_code == 200
        
        struktur = response.json()["struktur"]
        
        for klassenstufe, bereiche in struktur.items():
            assert len(bereiche) > 0, f"No Kompetenzbereiche for {klassenstufe}"
            for bereich_id, bereich_data in bereiche.items():
                assert "name" in bereich_data, f"Missing name in {bereich_id}"
                assert "themen" in bereich_data, f"Missing themen in {bereich_id}"
                assert len(bereich_data["themen"]) > 0, f"No themen in {bereich_id}"
        
        print(f"✓ All Klassenstufen have valid Kompetenzbereiche with Themen")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
