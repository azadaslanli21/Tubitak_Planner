"""
URL configuration for TUBITAK_PLANNER project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.urls import path
from . import views

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

urlpatterns = [
    # User API endpoints
    path('users/', views.userApi),  # GET all users, POST to create a user
    path('users/<int:id>/', views.userApi),  # GET, PUT, DELETE specific user by id

    # WorkPackage API endpoints
    path('workpackages/', views.workPackageApi),  # GET all work packages, POST to create a work package
    path('workpackages/<int:id>/', views.workPackageApi),  # GET, PUT, DELETE specific work package by id

    # Task API endpoints
    path('tasks/', views.taskApi),  # GET all tasks, POST to create a task
    path('tasks/<int:id>/', views.taskApi),  # GET, PUT, DELETE specific task by id
    
    path('project/', views.projectApi),
    path('project/<int:id>/', views.projectApi),  # GET, PUT, DELETE specific project by id

    path('deliverables/', views.deliverableApi),
    path('deliverables/<int:id>/', views.deliverableApi),

    path('budget/', views.budgetEntryApi),

    # JWT endpoints
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),

    # REGISTRATION endpoint
    path('register/', views.registerProjectLead),
]

