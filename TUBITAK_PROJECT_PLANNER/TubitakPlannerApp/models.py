from django.db import models
from django.contrib.auth.models import AbstractUser

class ProjectLeadUser(AbstractUser):
    email = models.EmailField(unique=True)
    def __str__(self):
        return self.username

class User(models.Model):
    id= models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    wage = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return self.name


class WorkPackage(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('closed', 'Closed'),
    ]
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    start_date = models.IntegerField()
    end_date = models.IntegerField()
    status = models.CharField(
        max_length=7,
        choices=STATUS_CHOICES,
        default='active',
    )
    users = models.ManyToManyField(User, related_name='work_packages')

    def __str__(self):
        return self.name


class Task(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('closed', 'Closed'),
    ]
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    start_date = models.IntegerField()
    end_date = models.IntegerField()
    status = models.CharField(
        max_length=7,
        choices=STATUS_CHOICES,
        default='active',
    )
    users = models.ManyToManyField(User, related_name='tasks')
    work_package = models.ForeignKey(WorkPackage, on_delete=models.CASCADE, related_name='tasks')

    def __str__(self):
        return self.name


class Project(models.Model):
    """
    A single-row table holding the active project's basic info.
    You'll only ever have id=1, but keeping an ID makes life easy.
    """
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    start_date = models.DateField()

    def __str__(self):
        return self.name
    
class Deliverable(models.Model) :
    id = models.AutoField(primary_key=True)
    
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    deadline = models.IntegerField(null=True, blank=True)
    work_package = models.ForeignKey(WorkPackage, on_delete=models.CASCADE, related_name='deliverables')    

class BudgetEntry(models.Model):
    id = models.AutoField(primary_key=True)
    work_package = models.ForeignKey(WorkPackage, on_delete=models.CASCADE, related_name='budget_entries')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='budget_entries')
    month = models.IntegerField()
    contribution = models.DecimalField(max_digits=3, decimal_places=2)

    class Meta:
        unique_together = ('work_package', 'user', 'month')

    def __str__(self):
        return f"{self.work_package.name} - {self.user.name} - Month {self.month}: {self.contribution}"