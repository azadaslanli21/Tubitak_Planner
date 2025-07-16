from django.http import JsonResponse
from rest_framework.parsers import JSONParser
from .models import User, WorkPackage, Task, Project, Deliverable, BudgetEntry
from .serializers import UserSerializer, WorkPackageSerializer, TaskSerializer, ProjectSerializer, DeliverableSerializer, BudgetEntrySerializer
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
                return JsonResponse({"error": "User not found."}, status=404)

    elif request.method == 'POST':
        user_data = JSONParser().parse(request)
        user_serializer = UserSerializer(data=user_data)
        if user_serializer.is_valid():
            user_serializer.save()
            return JsonResponse({"message": "User added successfully!"}, safe=False)
        return JsonResponse({"error": "Invalid data provided. Please check the fields."}, status=400)

    elif request.method == 'PUT':
        user_data = JSONParser().parse(request)
        try:
            user = User.objects.get(id=id)
        except User.DoesNotExist:
            return JsonResponse({"error": "User not found."}, status=404)

        user_serializer = UserSerializer(user, data=user_data)
        if user_serializer.is_valid():
            user_serializer.save()
            return JsonResponse({"message": "User updated successfully!"}, safe=False)
        return JsonResponse({"error": "Invalid data provided. Please check the fields."}, status=400)


    elif request.method == 'DELETE':
        try:
            user = User.objects.get(id=id)
            user.delete()
            return JsonResponse({"message": "User deleted successfully!"}, safe=False)
        except User.DoesNotExist:
            return JsonResponse({"error": "User not found."}, status=404)

# WorkPackage API View
@csrf_exempt
def workPackageApi(request, id=0):
    if request.method == 'GET':
        if id == 0:
            work_packages = WorkPackage.objects.order_by('start_date', 'end_date')
            work_package_serializer = WorkPackageSerializer(work_packages, many=True)
            return JsonResponse(work_package_serializer.data, safe=False)
        else:
            try:
                work_package = WorkPackage.objects.get(id=id)
                work_package_serializer = WorkPackageSerializer(work_package)
                return JsonResponse(work_package_serializer.data)
            except WorkPackage.DoesNotExist:
                return JsonResponse({"error": "WorkPackage not found."}, status=404)

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
                return JsonResponse({"error": f"User with ID {user_id} not found."}, status=404)

        # Serialize and save the WorkPackage
        work_package_serializer = WorkPackageSerializer(data=work_package_data)
        if work_package_serializer.is_valid():
            work_package = work_package_serializer.save()
            work_package.users.set(users)  # Associate users with the work package
            return JsonResponse({"message": "WorkPackage added successfully!"}, safe=False)
        return JsonResponse({"error": "Invalid data for work package. Please check the fields."}, status=400)

    elif request.method == 'PUT':
        work_package_data = JSONParser().parse(request)
        try:
            work_package = WorkPackage.objects.get(id=id)
        except WorkPackage.DoesNotExist:
            return JsonResponse({"error": "WorkPackage not found."}, status=404)

        # Add users to WorkPackage
        user_ids = work_package_data.get('users', [])
        users = []
        for user_id in user_ids:
            try:
                user = User.objects.get(id=user_id)
                users.append(user)
            except User.DoesNotExist:
                return JsonResponse({"error": f"User with ID {user_id} not found."}, status=404)

        work_package_serializer = WorkPackageSerializer(work_package, data=work_package_data)
        if work_package_serializer.is_valid():
            work_package_serializer.save()
            work_package.users.set(users)  # Update users for the work package
            return JsonResponse({"message": "WorkPackage updated successfully!"}, safe=False)
        return JsonResponse({"error": "Failed to update work package."}, status=400)

    elif request.method == 'DELETE':
        try:
            work_package = WorkPackage.objects.get(id=id)
            work_package.delete()
            return JsonResponse({"message": "WorkPackage deleted successfully!"}, safe=False)
        except WorkPackage.DoesNotExist:
            return JsonResponse({"error": "WorkPackage not found."}, status=404)

# Task API View
@csrf_exempt
def taskApi(request, id=0):
    if request.method == 'GET':
        if id == 0:
            tasks = Task.objects.order_by('start_date', 'end_date')
            task_serializer = TaskSerializer(tasks, many=True)
            return JsonResponse(task_serializer.data, safe=False)
        else:
            try:
                task = Task.objects.get(id=id)
                task_serializer = TaskSerializer(task)
                return JsonResponse(task_serializer.data)
            except Task.DoesNotExist:
                return JsonResponse({"error": "Invalid data for task. Please check the fields."}, status=400)


    elif request.method == 'POST':
        task_data = JSONParser().parse(request)
        
        # Validate the work package
        try:
            work_package = WorkPackage.objects.get(id=task_data['work_package'])
        except WorkPackage.DoesNotExist:
            return JsonResponse({"error": "WorkPackage not found."}, status=404)

        # Check if task's start and end weeks fall within the work package's start and end weeks
        task_start_week = int(task_data['start_date'])
        task_end_week = int(task_data['end_date'])
        wp_start_week = work_package.start_date
        wp_end_week = work_package.end_date

        if task_start_week < wp_start_week or task_end_week > wp_end_week:
            return JsonResponse({"error": "Task weeks cannot exceed WorkPackage weeks."}, status=400)

        # Validate if users are part of the work package
        wp_users = work_package.users.all().values_list('id', flat=True)
        task_users = task_data.get('users', [])

        for user_id in task_users:
            if user_id not in wp_users:
                try:
                    user = User.objects.get(id=user_id)
                    return JsonResponse({"error": f"User {user.name} is not part of the WorkPackage."}, status=400)
                    
                    
                except User.DoesNotExist:
                    return JsonResponse({"error": f"User with id {user_id} does not exists"}, status=404)
                    

        # Serialize and save the Task
        task_serializer = TaskSerializer(data=task_data)
        if task_serializer.is_valid():
            task = task_serializer.save()
            task.users.set(task_users)  # Associate users with the task
            task.work_package = work_package  # Assign the task to the WorkPackage
            task.save()  # Save the changes
            return JsonResponse({"message": "Task added successfully!"}, safe=False)
        return JsonResponse({"error": "Failed to add task."}, status=404)

    elif request.method == 'PUT':
        task_data = JSONParser().parse(request)
        try:
            task = Task.objects.get(id=id)
        except Task.DoesNotExist:
            return JsonResponse({"error": "Task not found."}, status=404)

        # Fetch the associated WorkPackage
        try:
            work_package = WorkPackage.objects.get(id=task_data['work_package'])
        except WorkPackage.DoesNotExist:
            return JsonResponse({"error": "WorkPackage not found."}, status=404)

        # Check if task's start and end weeks fall within the work package's start and end weeks
        task_start_week = int(task_data['start_date'])
        task_end_week = int(task_data['end_date'])
        wp_start_week = work_package.start_date
        wp_end_week = work_package.end_date

        if task_start_week < wp_start_week or task_end_week > wp_end_week:
            return JsonResponse({"error": "Task weeks cannot exceed WorkPackage weeks."}, status=400)

        # Validate if users are part of the work package
        wp_users = work_package.users.all().values_list('id', flat=True)
        task_users = task_data.get('users', [])

        for user_id in task_users:
            if user_id not in wp_users:
                try:
                    user = User.objects.get(id=user_id)
                    return JsonResponse({"error": f"User {user.name} is not part of the WorkPackage."}, status=400)
                    
                    
                except User.DoesNotExist:
                    return JsonResponse({"error": f"User with id {user_id} does not exists"}, status=404)
                    

        task_serializer = TaskSerializer(task, data=task_data)
        if task_serializer.is_valid():
            task_serializer.save()
            return JsonResponse({"message": "Task updated successfully!"}, safe=False)
        return JsonResponse({"error": "Failed to update task."}, status=400)

    elif request.method == 'DELETE':
        try:
            task = Task.objects.get(id=id)
            task.delete()
            return JsonResponse({"message": "Task deleted successfully!"}, safe=False)
        except Task.DoesNotExist:
            return JsonResponse({"error": "Task not found."}, status=404)


@csrf_exempt
def projectApi(request, id=None):
    """
    GET    → returns the single project (404 if none yet)
    POST   → create if none exists
    PUT    → update the existing one
    """
    if request.method == 'GET':
        try:
            proj = Project.objects.get(pk=id if id else 1)
            return JsonResponse(ProjectSerializer(proj).data, safe=False)
        except Project.DoesNotExist:
            return JsonResponse({"error": "No project set."}, status=404)

    if request.method == 'POST':
        if id is not None:
            return JsonResponse({"error": "POST request should not include an ID in the URL."}, status=400)
        data = JSONParser().parse(request)
        if Project.objects.filter(pk=1).exists():
            return JsonResponse({"error": "Project already exists. Use PUT to update."}, status=400)
        
        ser = ProjectSerializer(data=data)
        if ser.is_valid():
            ser.save()
            return JsonResponse(ser.data, status=201, safe=False)
        return JsonResponse({"error": "Invalid project data. Please check the fields."}, status=400)

    if request.method == 'PUT':
        if id is None:
            id = 1
        
        data = JSONParser().parse(request)
        try:
            proj = Project.objects.get(pk=id)
        except Project.DoesNotExist:
            return JsonResponse({"error": "Project not found to update."}, status=404)
        
        ser = ProjectSerializer(proj, data=data)
        if ser.is_valid():
            ser.save()
            return JsonResponse(ser.data, safe=False)
        return JsonResponse({"error": "Invalid project data. Please check the fields."}, status=400)
    
    return JsonResponse({"error": f"Method {request.method} not allowed or ID mismatch."}, status=405)

# Delvierable API View
@csrf_exempt
def deliverableApi(request, id=0):
    if request.method == 'GET':
        if id == 0:
            deliverables = Deliverable.objects.order_by('deadline')
            deliverable_serializer = DeliverableSerializer(deliverables, many=True)
            return JsonResponse(deliverable_serializer.data, safe=False)
        else:
            try:
                deliverable = Deliverable.objects.get(id=id)
                deliverable_serializer = DeliverableSerializer(deliverable)
                return JsonResponse(deliverable_serializer.data)
            except Deliverable.DoesNotExist:
                return JsonResponse({"error": "Deliverable not found."}, status=404)

    elif request.method == 'POST':
        deliverable_data = JSONParser().parse(request)
        
        # Validate the work package
        try:
            work_package = WorkPackage.objects.get(id=deliverable_data['work_package'])
        except WorkPackage.DoesNotExist:
            return JsonResponse({"error": "WorkPackage not found."}, status=404)

        # Check if deliverable's deadline fall within the work package's start and end months
        deliverable_deadline = int(deliverable_data['deadline'])
        wp_start_month = work_package.start_date
        wp_end_month = work_package.end_date

        if deliverable_deadline< wp_start_month or deliverable_deadline > wp_end_month:
            return JsonResponse({"error": "Deliverable deadline cannot exceed WorkPackage months."}, status=400)

        
        # Serialize and save the Deliverable
        deliverable_serializer = DeliverableSerializer(data=deliverable_data)
        if deliverable_serializer.is_valid():
            deliverable = deliverable_serializer.save()
            deliverable.work_package = work_package  # Assign the deliverable to the WorkPackage
            deliverable.save()  # Save the changes
            return JsonResponse({"message": "Deliverable added successfully!"}, safe=False)
        return JsonResponse({"error": "Failed to add deliverable."}, status=400)

    elif request.method == 'PUT':
        deliverable_data = JSONParser().parse(request)
        try:
            deliverable = Deliverable.objects.get(id=id)
        except Deliverable.DoesNotExist:
            return JsonResponse({"error": "Deliverable not found."}, status=404)

        # Fetch the associated WorkPackage
        try:
            work_package = WorkPackage.objects.get(id=deliverable_data['work_package'])
        except WorkPackage.DoesNotExist:
            return JsonResponse({"error": "WorkPackage not found."}, status=404)

        # Check if deliverable's deadline fall within the work package's start and end months
        deliverable_deadline = int(deliverable_data['deadline'])
        wp_start_month = work_package.start_date
        wp_end_month = work_package.end_date

        if deliverable_deadline< wp_start_month or deliverable_deadline > wp_end_month:
            return JsonResponse({"error": "Deliverable deadline cannot exceed WorkPackage months."}, status=400)

        deliverable_serializer = DeliverableSerializer(deliverable, data=deliverable_data)
        if deliverable_serializer.is_valid():
            deliverable_serializer.save()
            return JsonResponse({"message": "Deliverable updated successfully!"}, safe=False)
        return JsonResponse({"error": "Failed to update deliverable."}, status=400)

    elif request.method == 'DELETE':
        try:
            deliverable = Deliverable.objects.get(id=id)
            deliverable.delete()
            return JsonResponse({"message": "Deliverable deleted successfully!"}, safe=False)
        except Deliverable.DoesNotExist:
            return JsonResponse({"error": "Deliverable not found."}, status=404)

@csrf_exempt
def budgetEntryApi(request):
    if request.method == 'GET':
        budget_entries = BudgetEntry.objects.all()
        budget_entry_serializer = BudgetEntrySerializer(budget_entries, many=True)
        
        # transform data for frontend compatibility (key-value pair)
        transformed_data = {}
        for entry in budget_entry_serializer.data:
            key = f"{entry['work_package']}_{entry['user']}_{entry['month']}"
            transformed_data[key] = entry['contribution']
        return JsonResponse(transformed_data, safe=False)

    elif request.method == 'POST':
        data = JSONParser().parse(request)
        
        # consider a better way to partially update the budget entries
        BudgetEntry.objects.all().delete()
        
        saved_entries = []
        errors = []

        for key, value in data.items():
            try:
                wp_id, user_id, month = key.split('_')
                entry_data = {
                    'work_package': int(wp_id),
                    'user': int(user_id),
                    'month': int(month),
                    'contribution': value
                }
                serializer = BudgetEntrySerializer(data=entry_data)
                if serializer.is_valid():
                    serializer.save()
                    saved_entries.append(serializer.data)
                else:
                    errors.append({key: serializer.errors})
            except Exception as e:
                errors.append({key: str(e)})

        if errors:
            print("Budget save errors:", errors) 
            return JsonResponse({"error": "Failed to save some budget entries. Please check the data and try again."}, status=400)
        
        return JsonResponse({"message": "Budget saved successfully!", "saved_entries": len(saved_entries)}, status=201)

               
