from django.http import JsonResponse
from rest_framework.parsers import JSONParser
from .models import User, WorkPackage, Task
from .serializers import UserSerializer, WorkPackageSerializer, TaskSerializer
from django.views.decorators.csrf import csrf_exempt

# User API View
@csrf_exempt
def userApi(request, id=0):
    if request.method == 'GET':
        if id == 0:
            users = User.objects.all()
            user_serializer = UserSerializer(users, many=True)
            return JsonResponse(user_serializer.data, safe=False)
        else:
            try:
                user = User.objects.get(id=id)
                user_serializer = UserSerializer(user)
                return JsonResponse(user_serializer.data)
            except User.DoesNotExist:
                return JsonResponse("User not found.", status=404, safe=False)

    elif request.method == 'POST':
        user_data = JSONParser().parse(request)
        user_serializer = UserSerializer(data=user_data)
        if user_serializer.is_valid():
            user_serializer.save()
            return JsonResponse("User added successfully!", safe=False)
        return JsonResponse(user_serializer.errors, status=400, safe=False)

    elif request.method == 'PUT':
        user_data = JSONParser().parse(request)
        try:
            user = User.objects.get(id=id)
        except User.DoesNotExist:
            return JsonResponse("User not found.", status=404, safe=False)

        user_serializer = UserSerializer(user, data=user_data)
        if user_serializer.is_valid():
            user_serializer.save()
            return JsonResponse("User updated successfully!", safe=False)
        return JsonResponse("Failed to update user.", status=400, safe=False)

    elif request.method == 'DELETE':
        try:
            user = User.objects.get(id=id)
            user.delete()
            return JsonResponse("User deleted successfully!", safe=False)
        except User.DoesNotExist:
            return JsonResponse("User not found.", status=404, safe=False)

# WorkPackage API View
@csrf_exempt
def workPackageApi(request, id=0):
    if request.method == 'GET':
        if id == 0:
            work_packages = WorkPackage.objects.all()
            work_package_serializer = WorkPackageSerializer(work_packages, many=True)
            return JsonResponse(work_package_serializer.data, safe=False)
        else:
            try:
                work_package = WorkPackage.objects.get(id=id)
                work_package_serializer = WorkPackageSerializer(work_package)
                return JsonResponse(work_package_serializer.data)
            except WorkPackage.DoesNotExist:
                return JsonResponse("WorkPackage not found.", status=404, safe=False)

    elif request.method == 'POST':
        work_package_data = JSONParser().parse(request)
        
        # Add users to WorkPackage
        user_ids = work_package_data.get('users', [])
        users = []
        for user_id in user_ids:
            try:
                user = User.objects.get(id=user_id)
                users.append(user)
            except User.DoesNotExist:
                return JsonResponse(f"User with ID {user_id} not found.", status=404, safe=False)

        # Serialize and save the WorkPackage
        work_package_serializer = WorkPackageSerializer(data=work_package_data)
        if work_package_serializer.is_valid():
            work_package = work_package_serializer.save()
            work_package.users.set(users)  # Associate users with the work package
            return JsonResponse("WorkPackage added successfully!", safe=False)
        return JsonResponse("Failed to add work package.", status=400, safe=False)

    elif request.method == 'PUT':
        work_package_data = JSONParser().parse(request)
        try:
            work_package = WorkPackage.objects.get(id=id)
        except WorkPackage.DoesNotExist:
            return JsonResponse("WorkPackage not found.", status=404, safe=False)

        # Add users to WorkPackage
        user_ids = work_package_data.get('users', [])
        users = []
        for user_id in user_ids:
            try:
                user = User.objects.get(id=user_id)
                users.append(user)
            except User.DoesNotExist:
                return JsonResponse(f"User with ID {user_id} not found.", status=404, safe=False)

        work_package_serializer = WorkPackageSerializer(work_package, data=work_package_data)
        if work_package_serializer.is_valid():
            work_package_serializer.save()
            work_package.users.set(users)  # Update users for the work package
            return JsonResponse("WorkPackage updated successfully!", safe=False)
        return JsonResponse("Failed to update work package.", status=400, safe=False)

    elif request.method == 'DELETE':
        try:
            work_package = WorkPackage.objects.get(id=id)
            work_package.delete()
            return JsonResponse("WorkPackage deleted successfully!", safe=False)
        except WorkPackage.DoesNotExist:
            return JsonResponse("WorkPackage not found.", status=404, safe=False)

# Task API View
@csrf_exempt
def taskApi(request, id=0):
    if request.method == 'GET':
        if id == 0:
            tasks = Task.objects.all()
            task_serializer = TaskSerializer(tasks, many=True)
            return JsonResponse(task_serializer.data, safe=False)
        else:
            try:
                task = Task.objects.get(id=id)
                task_serializer = TaskSerializer(task)
                return JsonResponse(task_serializer.data)
            except Task.DoesNotExist:
                return JsonResponse("Task not found.", status=404, safe=False)

    elif request.method == 'POST':
        task_data = JSONParser().parse(request)
        
        # Validate the work package
        try:
            work_package = WorkPackage.objects.get(id=task_data['work_package'])
        except WorkPackage.DoesNotExist:
            return JsonResponse("WorkPackage not found.", status=404, safe=False)

        # Check if task's start and end weeks fall within the work package's start and end weeks
        task_start_week = int(task_data['start_date'])
        task_end_week = int(task_data['end_date'])
        wp_start_week = work_package.start_date
        wp_end_week = work_package.end_date

        if task_start_week < wp_start_week or task_end_week > wp_end_week:
            return JsonResponse("Task weeks cannot exceed WorkPackage weeks.", status=400, safe=False)

        # Validate if users are part of the work package
        wp_users = work_package.users.all().values_list('id', flat=True)
        task_users = task_data.get('users', [])

        for user_id in task_users:
            if user_id not in wp_users:
                return JsonResponse(f"User with ID {user_id} is not part of the WorkPackage.", status=400, safe=False)

        # Serialize and save the Task
        task_serializer = TaskSerializer(data=task_data)
        if task_serializer.is_valid():
            task = task_serializer.save()
            task.users.set(task_users)  # Associate users with the task
            task.work_package = work_package  # Assign the task to the WorkPackage
            task.save()  # Save the changes
            return JsonResponse("Task added successfully!", safe=False)
        return JsonResponse("Failed to add task.", status=400, safe=False)

    elif request.method == 'PUT':
        task_data = JSONParser().parse(request)
        try:
            task = Task.objects.get(id=id)
        except Task.DoesNotExist:
            return JsonResponse("Task not found.", status=404, safe=False)

        # Fetch the associated WorkPackage
        try:
            work_package = WorkPackage.objects.get(id=task_data['work_package'])
        except WorkPackage.DoesNotExist:
            return JsonResponse("WorkPackage not found.", status=404, safe=False)

        # Check if task's start and end weeks fall within the work package's start and end weeks
        task_start_week = int(task_data['start_date'])
        task_end_week = int(task_data['end_date'])
        wp_start_week = work_package.start_date
        wp_end_week = work_package.end_date

        if task_start_week < wp_start_week or task_end_week > wp_end_week:
            return JsonResponse("Task weeks cannot exceed WorkPackage weeks.", status=400, safe=False)

        # Validate if users are part of the work package
        wp_users = work_package.users.all().values_list('id', flat=True)
        task_users = task_data.get('users', [])

        for user_id in task_users:
            if user_id not in wp_users:
                return JsonResponse(f"User with ID {user_id} is not part of the WorkPackage.", status=400, safe=False)

        task_serializer = TaskSerializer(task, data=task_data)
        if task_serializer.is_valid():
            task_serializer.save()
            return JsonResponse("Task updated successfully!", safe=False)
        return JsonResponse("Failed to update task.", status=400, safe=False)

    elif request.method == 'DELETE':
        try:
            task = Task.objects.get(id=id)
            task.delete()
            return JsonResponse("Task deleted successfully!", safe=False)
        except Task.DoesNotExist:
            return JsonResponse("Task not found.", status=404, safe=False)
