import sys, pathlib, pytest
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from app.config import settings
from app.store import store


@pytest.fixture(autouse=True)
def reset_store_state(tmp_path):
    settings.mock_mode = True
    settings.github_token = ""
    settings.reviewer_allowlist = "nikhil-0420"
    store.reports.clear()
    store.data_dir = tmp_path / "reports"
    store.data_dir.mkdir(parents=True, exist_ok=True)
    store.load_mocks()
    yield
    store.reports.clear()


