"""
WSGI entrypoint for production servers (e.g. Waitress/Gunicorn).

Exposes `application` which wraps the Flask `app` defined in app.py.
"""

from app import app as application


