from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = 'REPLACE_ME'
DEBUG = False
ALLOWED_HOSTS = ['localhost', '127.0.0.1', 'testserver']
INSTALLED_APPS = ['django.contrib.staticfiles', 'homepage', 'zones', 'deliveries']
MIDDLEWARE = ['django.middleware.security.SecurityMiddleware', 'django.middleware.common.CommonMiddleware', 'django.middleware.csrf.CsrfViewMiddleware']
ROOT_URLCONF = 'delivery_service.urls'
TEMPLATES = [{'BACKEND': 'django.template.backends.django.DjangoTemplates', 'DIRS': [BASE_DIR / 'templates'], 'APP_DIRS': True, 'OPTIONS': {'context_processors': ['django.template.context_processors.request']}}]
DATABASES = {}
DELIVERY_DB = BASE_DIR / 'data' / 'deliveries.db'
STATIC_URL = '/static/'
STATICFILES_DIRS = [BASE_DIR / 'static']
LANGUAGE_CODE = 'ru-ru'
TIME_ZONE = 'Europe/Moscow'
USE_TZ = False
