from rest_framework import serializers
from TubitakPlannerApp.models import ProjectLeadUser, User, WorkPackage, Task, Project, Deliverable, BudgetEntry

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
                  'project',
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
        read_only_fields = ['id']
        
class DeliverableSerializer(serializers.ModelSerializer):
    class Meta:
        model = Deliverable
        fields = ['id', 'name', 'description', 'deadline', 'work_package']

class BudgetEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = BudgetEntry
        fields = ('id', 'work_package', 'user', 'month', 'contribution')                     

class ProjectLeadRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = ProjectLeadUser
        fields = ['username', 'email', 'password', 'password_confirm']

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Passwords must match.")
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = ProjectLeadUser.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'], 
        )
        return user
