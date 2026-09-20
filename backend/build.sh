#!/usr/bin/env bash
set -o errexit

pip install --no-cache-dir -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate
python manage.py seed

if [[ -n "${DJANGO_SUPERUSER_EMAIL:-}" && -n "${DJANGO_SUPERUSER_PASSWORD:-}" ]]; then
  python manage.py shell -c '
import os
from django.contrib.auth import get_user_model

User = get_user_model()
username = os.getenv("DJANGO_SUPERUSER_USERNAME", "admin")
email = os.environ["DJANGO_SUPERUSER_EMAIL"]
password = os.environ["DJANGO_SUPERUSER_PASSWORD"]
user, _ = User.objects.get_or_create(username=username)
user.email = email
user.is_staff = True
user.is_superuser = True
user.set_password(password)
user.save()
'
fi
