from django.contrib import admin

# Register your models here.
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import ProjectLeadUser

class CustomUserAdmin(UserAdmin):
    model = ProjectLeadUser
    list_display = ['username', 'email', 'is_staff', 'is_active']
    search_fields = ['username', 'email']
    ordering = ['username']
    fieldsets = UserAdmin.fieldsets  # use default field layout
    add_fieldsets = UserAdmin.add_fieldsets  # for user creation

admin.site.register(ProjectLeadUser, CustomUserAdmin)
