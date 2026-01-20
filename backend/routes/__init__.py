# Routes module
from routes.classes import router as classes_router
from routes.faecher.deutsch import router as deutsch_router
from routes.faecher.mathe import router as mathe_router
from routes.school_years import router as school_years_router
from routes.workplan import router as workplan_router

__all__ = [
    'classes_router', 
    'deutsch_router', 
    'mathe_router',
    'school_years_router',
    'workplan_router'
]
