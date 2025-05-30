from rest_framework import serializers
from TubitakPlannerApp.models import User, WorkPackage, Task, Project, Deliverable, BudgetEntry

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id',
                  'name',
                  'wage')


class WorkPackageSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkPackage
        fields = ('id',
                  'name',
                  'description',
                  'start_date',
                  'end_date',
                  'status',
                  'users') 
        
        
class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ('id',
                  'name',
                  'description',
                  'start_date',
                  'end_date',
                  'status',
                  'users',
                  'work_package')
                
class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Project
        fields = ['id', 'name', 'start_date']   
        
class DeliverableSerializer(serializers.ModelSerializer):
    class Meta:
        model = Deliverable
        fields = ['id', 'name', 'description', 'deadline', 'work_package']

class BudgetEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = BudgetEntry
        fields = ('id', 'work_package', 'user', 'month', 'contribution')                     