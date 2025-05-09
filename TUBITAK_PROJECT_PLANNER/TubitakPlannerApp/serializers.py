from rest_framework import serializers
from TubitakProjectApp.models import User, WorkPackage, Task

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
                